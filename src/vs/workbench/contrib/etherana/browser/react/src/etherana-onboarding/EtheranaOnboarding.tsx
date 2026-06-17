/*--------------------------------------------------------------------------------------
 *  © 2026 GoAnon. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { useEffect, useRef, useState } from 'react';
import { useAccessor, useIsDark, useSettingsState } from '../util/services.js';
import { Brain, Check, ChevronRight, DollarSign, ExternalLink, Lock, X } from 'lucide-react';
import { displayInfoOfProviderName, ProviderName, providerNames, localProviderNames, featureNames, FeatureName } from '../../../../common/etheranaSettingsTypes.js';
import { ChatMarkdownRender } from '../markdown/ChatMarkdownRender.js';
import { OllamaSetupInstructions, OneClickSwitchButton, SettingsForProvider } from '../etherana-settings-tsx/Settings.js';
import { EtheranaButtonBgDarken } from '../util/inputs.js';
import { ColorScheme } from '../../../../../../../platform/theme/common/theme.js';
import ErrorBoundary from '../sidebar-tsx/ErrorBoundary.js';
import { isLinux } from '../../../../../../../base/common/platform.js';

const OVERRIDE_VALUE = false

export const EtheranaOnboarding = () => {

	const etheranaSettingsState = useSettingsState()
	const isOnboardingComplete = etheranaSettingsState.globalSettings.isOnboardingComplete || OVERRIDE_VALUE

	const isDark = useIsDark()

	return (
		<div className={`@@etherana-scope ${isDark ? 'dark' : ''}`}>
			<div
				className={`
					bg-etherana-bg-3 fixed top-0 right-0 bottom-0 left-0 width-full z-[99999]
					transition-all duration-1000 ${isOnboardingComplete ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'}
				`}
				style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
			>
				<ErrorBoundary>
					<EtheranaOnboardingContent />
				</ErrorBoundary>
			</div>
		</div>
	)
}

const EtheranaIcon = () => {
	const accessor = useAccessor()
	const themeService = accessor.get('IThemeService')

	const divRef = useRef<HTMLDivElement | null>(null)

	useEffect(() => {
		// void icon style
		const updateTheme = () => {
			const theme = themeService.getColorTheme().type
			const isDark = theme === ColorScheme.DARK || theme === ColorScheme.HIGH_CONTRAST_DARK
			if (divRef.current) {
				divRef.current.style.maxWidth = '220px'
				divRef.current.style.opacity = '50%'
				divRef.current.style.filter = isDark ? '' : 'invert(1)' //brightness(.5)
			}
		}
		updateTheme()
		const d = themeService.onDidColorThemeChange(updateTheme)
		return () => d.dispose()
	}, [])

	return <div ref={divRef} className='@@etherana-icon' />
}

const FADE_DURATION_MS = 2000

const FadeIn = ({ children, className, delayMs = 0, durationMs, ...props }: { children: React.ReactNode, delayMs?: number, durationMs?: number, className?: string } & React.HTMLAttributes<HTMLDivElement>) => {

	const [opacity, setOpacity] = useState(0)

	const effectiveDurationMs = durationMs ?? FADE_DURATION_MS

	useEffect(() => {

		const timeout = setTimeout(() => {
			setOpacity(1)
		}, delayMs)

		return () => clearTimeout(timeout)
	}, [setOpacity, delayMs])


	return (
		<div className={className} style={{ opacity, transition: `opacity ${effectiveDurationMs}ms ease-in-out` }} {...props}>
			{children}
		</div>
	)
}

// Onboarding

// =============================================
//  New AddProvidersPage Component and helpers
// =============================================

const tabNames = ['Local', 'Free', 'Paid'] as const;

type TabName = typeof tabNames[number] | 'Cloud/Other';

// Data for cloud providers tab
const cloudProviders: ProviderName[] = ['googleVertex', 'liteLLM', 'microsoftAzure', 'awsBedrock', 'openAICompatible'];

// Data structures for provider tabs
const providerNamesOfTab: Record<TabName, ProviderName[]> = {
	Free: ['gemini', 'openRouter'],
	Local: localProviderNames,
	Paid: providerNames.filter(pn => !(['gemini', 'openRouter', ...localProviderNames, ...cloudProviders] as string[]).includes(pn)) as ProviderName[],
	'Cloud/Other': cloudProviders,
};

const descriptionOfTab: Record<TabName, string> = {
	Free: `Optional cloud providers with a free tier. You can add these later.`,
	Paid: `Optional paid cloud providers. Bring your own key if you want to use them.`,
	Local: `Recommended for privacy-first use. Local providers can be configured now or later.`,
	'Cloud/Other': `Optional advanced providers and OpenAI-compatible endpoints. You can configure these later.`,
};


const featureNameMap: { display: string, featureName: FeatureName }[] = [
	{ display: 'Chat', featureName: 'Chat' },
	{ display: 'Quick Edit', featureName: 'Ctrl+K' },
	{ display: 'Autocomplete', featureName: 'Autocomplete' },
	{ display: 'Fast Apply', featureName: 'Apply' },
	{ display: 'Source Control', featureName: 'SCM' },
];

const placeholderModelNameOfProvider = (providerName: ProviderName): string => {
	if (providerName === 'ollama') return 'model-from-ollama-list';
	if (providerName === 'lmStudio') return 'model-id-from-lm-studio';
	if (providerName === 'openRouter') return 'provider/model-id';
	if (providerName === 'openAICompatible') return 'model-id-from-your-server';
	return 'exact-model-id-from-provider';
};

const AddProvidersPage = ({ pageIndex, setPageIndex }: { pageIndex: number, setPageIndex: (index: number) => void }) => {
	const accessor = useAccessor()
	const settingsStateService = accessor.get('IEtheranaSettingsService')
	const [currentTab, setCurrentTab] = useState<TabName>('Local');
	const settingsState = useSettingsState();
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [manualModelNames, setManualModelNames] = useState<Partial<Record<ProviderName, string>>>({});
	const [manualModelMessages, setManualModelMessages] = useState<Partial<Record<ProviderName, string>>>({});

	const addManualModel = (providerName: ProviderName) => {
		const modelName = manualModelNames[providerName]?.trim();

		if (!modelName) {
			setManualModelMessages(prev => ({ ...prev, [providerName]: 'Enter the exact model ID shown by your provider.' }));
			return;
		}

		if (settingsState.settingsOfProvider[providerName].models.find(model => model.modelName === modelName)) {
			setManualModelMessages(prev => ({ ...prev, [providerName]: 'This model is already added.' }));
			return;
		}

		settingsStateService.addModel(providerName, modelName);
		setManualModelNames(prev => ({ ...prev, [providerName]: '' }));
		setManualModelMessages(prev => ({ ...prev, [providerName]: `Added ${modelName}. You can change this later in Settings.` }));
	};


	// Clear error message after 5 seconds
	useEffect(() => {
		let timeoutId: NodeJS.Timeout | null = null;

		if (errorMessage) {
			timeoutId = setTimeout(() => {
				setErrorMessage(null);
			}, 5000);
		}

		// Cleanup function to clear the timeout if component unmounts or error changes
		return () => {
			if (timeoutId) {
				clearTimeout(timeoutId);
			}
		};
	}, [errorMessage]);

	return (<div className="flex flex-col md:flex-row w-full max-h-[72vh] overflow-y-auto gap-6 max-w-[900px] mx-auto relative pr-2">
		{/* Left Column */}
		<div className="md:w-1/4 w-full flex flex-col gap-6 p-6 border-none border-etherana-border-2 md:sticky md:top-0 md:self-start bg-etherana-bg-1/95">
			{/* Tab Selector */}
			<div className="flex md:flex-col gap-2">
				{[...tabNames, 'Cloud/Other'].map(tab => (
					<button
						key={tab}
						className={`py-2 px-4 rounded-md text-left ${currentTab === tab
							? 'bg-[#0e70c0]/80 text-white font-medium shadow-sm'
							: 'bg-etherana-bg-2 hover:bg-etherana-bg-2/80 text-etherana-fg-1'
							} transition-all duration-200`}
						onClick={() => {
							setCurrentTab(tab as TabName);
							setErrorMessage(null); // Reset error message when changing tabs
						}}
					>
						{tab}
					</button>
				))}
			</div>

			{/* Feature Checklist */}
			<div className="flex flex-col gap-1 mt-4 text-sm opacity-80">
				{featureNameMap.map(({ display, featureName }) => {
					const hasModel = settingsState.modelSelectionOfFeature[featureName] !== null;
					return (
						<div key={featureName} className="flex items-center gap-2">
							{hasModel ? (
								<Check className="w-4 h-4 text-emerald-500" />
							) : (
								<div className="w-3 h-3 rounded-full flex items-center justify-center">
									<div className="w-1 h-1 rounded-full bg-white/70"></div>
								</div>
							)}
							<span>{display}</span>
						</div>
					);
				})}
			</div>
		</div>

		{/* Right Column */}
		<div className="flex-1 flex flex-col items-center justify-start p-6 min-h-0">
			<div className="text-3xl mb-2 text-center w-full">Add a Provider</div>

			<div className="w-full max-w-xl mt-4 mb-10">
				<div className="text-2xl font-light my-4 w-full">{currentTab}</div>
				<div className="text-sm opacity-80 text-etherana-fg-3 my-4 w-full">{descriptionOfTab[currentTab]}</div>

				<div className="flex flex-col sm:flex-row gap-2 mt-6">
					<EtheranaButtonBgDarken
						className="text-sm px-4 py-2 bg-[#0e70c0] text-white"
						onClick={() => {
							setErrorMessage(null);
							setPageIndex(pageIndex + 1);
						}}
					>
						Continue without provider
					</EtheranaButtonBgDarken>
					<button
						className="text-sm px-4 py-2 rounded-md border border-etherana-border-4 text-etherana-fg-2 hover:bg-etherana-bg-2"
						onClick={() => {
							setErrorMessage(null);
							setPageIndex(pageIndex + 1);
						}}
					>
						Skip setup for now
					</button>
				</div>
			</div>

			{providerNamesOfTab[currentTab].map((providerName) => (
				<div key={providerName} className="w-full max-w-xl mb-10">
					<div className="text-xl mb-2">
						Configure {displayInfoOfProviderName(providerName).title}
						{providerName === 'gemini' && (
							<span
								data-tooltip-id="etherana-tooltip-provider-info"
								data-tooltip-content="Gemini 2.5 Pro offers 25 free messages a day, and Gemini 2.5 Flash offers 500. We recommend using models down the line as you run out of free credits."
								data-tooltip-place="right"
								className="ml-1 text-xs align-top text-blue-400"
							>*</span>
						)}
						{providerName === 'openRouter' && (
							<span
								data-tooltip-id="etherana-tooltip-provider-info"
								data-tooltip-content="OpenRouter offers 50 free messages a day, and 1000 if you deposit $10. Only applies to models labeled ':free'."
								data-tooltip-place="right"
								className="ml-1 text-xs align-top text-blue-400"
							>*</span>
						)}
					</div>
					<div>
						<div className="text-xs opacity-70 mb-3">
							Add your API key or endpoint here if this provider needs one. Then enter the exact model ID from your provider below.
						</div>
						<SettingsForProvider providerName={providerName} showProviderTitle={false} showProviderSuggestions={false} />

						<div className="mt-4 p-4 rounded bg-etherana-bg-2/50 border border-etherana-border-4">
							<div className="text-sm font-medium mb-2">Model ID</div>
							<p className="text-xs opacity-70 mb-3">
								Model names change often. Use the exact model ID shown by your provider. You can edit it later in Settings.
							</p>
							<div className="flex flex-col sm:flex-row gap-2">
								<input
									className="w-full rounded-md border border-etherana-border-4 bg-etherana-bg-1 px-3 py-2 text-sm text-etherana-fg-1"
									value={manualModelNames[providerName] ?? ''}
									placeholder={placeholderModelNameOfProvider(providerName)}
									onChange={(event) => {
										setManualModelNames(prev => ({ ...prev, [providerName]: event.target.value }));
										setManualModelMessages(prev => ({ ...prev, [providerName]: '' }));
									}}
									onKeyDown={(event) => {
										if (event.key === 'Enter') {
											addManualModel(providerName);
										}
									}}
								/>
								<EtheranaButtonBgDarken
									className="text-sm px-3 py-2 bg-[#0e70c0] text-white"
									onClick={() => addManualModel(providerName)}
								>
									Add model
								</EtheranaButtonBgDarken>
							</div>
							{manualModelMessages[providerName] && (
								<div className="text-xs opacity-80 mt-2">{manualModelMessages[providerName]}</div>
							)}
						</div>
					</div>
					{providerName === 'ollama' && <OllamaSetupInstructions />}
				</div>
			))}





			{/* Navigation buttons in right column */}
			<div className="sticky bottom-0 flex flex-col items-end w-full mt-auto pt-4 pb-2 bg-etherana-bg-1/95 backdrop-blur border-t border-etherana-border-4">
				{errorMessage && (
					<div className="text-amber-400 mb-2 text-sm opacity-80 transition-opacity duration-300">{errorMessage}</div>
				)}
				<div className="flex items-center gap-2">
					<PreviousButton onClick={() => setPageIndex(pageIndex - 1)} />
					<NextButton
						onClick={() => {
							setErrorMessage(null);
							setPageIndex(pageIndex + 1);
						}}
					/>
				</div>
			</div>
		</div>
	</div>);
};
// =============================================
// 	OnboardingPage
// 		title:
// 			div
// 				"Welcome to Etherana Coder"
// 			image
// 		content:<></>
// 		title
// 		content
// 		prev/next

// 	OnboardingPage
// 		title:
// 			div
// 				"How would you like to use Etherana?"
// 		content:
// 			ModelQuestionContent
// 				|
// 					div
// 						"I want to:"
// 					div
// 						"Use the smartest models"
// 						"Keep my data fully private"
// 						"Save money"
// 						"I don't know"
// 				| div
// 					| div
// 						"We recommend using "
// 						"Set API"
// 					| div
// 						""
// 					| div
//
// 		title
// 		content
// 		prev/next
//
// 	OnboardingPage
// 		title
// 		content
// 		prev/next

const NextButton = ({ onClick, ...props }: { onClick: () => void } & React.ButtonHTMLAttributes<HTMLButtonElement>) => {

	// Create a new props object without the disabled attribute
	const { disabled, ...buttonProps } = props;

	return (
		<button
			onClick={disabled ? undefined : onClick}
			onDoubleClick={onClick}
			className={`px-6 py-2 bg-zinc-100 ${disabled
				? 'bg-zinc-100/40 cursor-not-allowed'
				: 'hover:bg-zinc-100'
				} rounded text-black duration-600 transition-all
			`}
			{...disabled && {
				'data-tooltip-id': 'etherana-tooltip',
				"data-tooltip-content": 'Please enter all required fields or choose another provider', // (double-click to proceed anyway, can come back in Settings)
				"data-tooltip-place": 'top',
			}}
			{...buttonProps}
		>
			Next
		</button>
	)
}

const PreviousButton = ({ onClick, ...props }: { onClick: () => void } & React.ButtonHTMLAttributes<HTMLButtonElement>) => {
	return (
		<button
			onClick={onClick}
			className="px-6 py-2 rounded text-etherana-fg-3 opacity-80 hover:brightness-115 duration-600 transition-all"
			{...props}
		>
			Back
		</button>
	)
}



const OnboardingPageShell = ({ top, bottom, content, hasMaxWidth = true, className = '', }: {
	top?: React.ReactNode,
	bottom?: React.ReactNode,
	content?: React.ReactNode,
	hasMaxWidth?: boolean,
	className?: string,
}) => {
	return (
		<div className={`h-[80vh] text-lg flex flex-col gap-4 w-full mx-auto ${hasMaxWidth ? 'max-w-[600px]' : ''} ${className}`}>
			{top && <FadeIn className='w-full mb-auto pt-16'>{top}</FadeIn>}
			{content && <FadeIn className='w-full my-auto'>{content}</FadeIn>}
			{bottom && <div className='w-full pb-8'>{bottom}</div>}
		</div>
	)
}

const OllamaDownloadOrRemoveModelButton = ({ modelName, isModelInstalled, sizeGb }: { modelName: string, isModelInstalled: boolean, sizeGb: number | false | 'not-known' }) => {
	// for now just link to the ollama download page
	return <a
		href={`https://ollama.com/library/${modelName}`}
		target="_blank"
		rel="noopener noreferrer"
		className="flex items-center justify-center text-etherana-fg-2 hover:text-etherana-fg-1"
	>
		<ExternalLink className="w-3.5 h-3.5" />
	</a>

}


const YesNoText = ({ val }: { val: boolean | null }) => {

	return <div
		className={
			val === true ? "text text-emerald-500"
				: val === false ? 'text-rose-600'
					: "text text-amber-300"
		}
	>
		{
			val === true ? "Yes"
				: val === false ? 'No'
					: "Yes*"
		}
	</div>

}



const abbreviateNumber = (num: number): string => {
	if (num >= 1000000) {
		// For millions
		return Math.floor(num / 1000000) + 'M';
	} else if (num >= 1000) {
		// For thousands
		return Math.floor(num / 1000) + 'K';
	} else {
		// For numbers less than 1000
		return num.toString();
	}
}





const PrimaryActionButton = ({ children, className, ringSize, ...props }: { children: React.ReactNode, ringSize?: undefined | 'xl' | 'screen' } & React.ButtonHTMLAttributes<HTMLButtonElement>) => {


	return (
		<button
			type='button'
			className={`
				flex items-center justify-center

				text-white dark:text-black
				bg-black/90 dark:bg-white/90

				${ringSize === 'xl' ? `
					gap-2 px-16 py-8
					transition-all duration-300 ease-in-out
					`
					: ringSize === 'screen' ? `
					gap-2 px-16 py-8
					transition-all duration-1000 ease-in-out
					`: ringSize === undefined ? `
					gap-1 px-4 py-2
					transition-all duration-300 ease-in-out
				`: ''}

				rounded-lg
				group
				${className}
			`}
			{...props}
		>
			{children}
			<ChevronRight
				className={`
					transition-all duration-300 ease-in-out

					transform
					group-hover:translate-x-1
					group-active:translate-x-1
				`}
			/>
		</button>
	)
}


type WantToUseOption = 'smart' | 'private' | 'cheap' | 'all'

const EtheranaOnboardingContent = () => {


	const accessor = useAccessor()
	const etheranaSettingsService = accessor.get('IEtheranaSettingsService')
	const voidMetricsService = accessor.get('IMetricsService')

	const etheranaSettingsState = useSettingsState()

	const [pageIndex, setPageIndex] = useState(0)


	// page 1 state
	const [wantToUseOption, setWantToUseOption] = useState<WantToUseOption>('smart')

	// Replace the single selectedProviderName with four separate states
	// page 2 state - each tab gets its own state
	const [selectedIntelligentProvider, setSelectedIntelligentProvider] = useState<ProviderName>('anthropic');
	const [selectedPrivateProvider, setSelectedPrivateProvider] = useState<ProviderName>('ollama');
	const [selectedAffordableProvider, setSelectedAffordableProvider] = useState<ProviderName>('gemini');
	const [selectedAllProvider, setSelectedAllProvider] = useState<ProviderName>('anthropic');

	// Helper function to get the current selected provider based on active tab
	const getSelectedProvider = (): ProviderName => {
		switch (wantToUseOption) {
			case 'smart': return selectedIntelligentProvider;
			case 'private': return selectedPrivateProvider;
			case 'cheap': return selectedAffordableProvider;
			case 'all': return selectedAllProvider;
		}
	}

	// Helper function to set the selected provider for the current tab
	const setSelectedProvider = (provider: ProviderName) => {
		switch (wantToUseOption) {
			case 'smart': setSelectedIntelligentProvider(provider); break;
			case 'private': setSelectedPrivateProvider(provider); break;
			case 'cheap': setSelectedAffordableProvider(provider); break;
			case 'all': setSelectedAllProvider(provider); break;
		}
	}

	const providerNamesOfWantToUseOption: { [wantToUseOption in WantToUseOption]: ProviderName[] } = {
		smart: ['anthropic', 'openAI', 'gemini', 'openRouter'],
		private: ['ollama', 'vLLM', 'openAICompatible', 'lmStudio'],
		cheap: ['gemini', 'deepseek', 'openRouter', 'ollama', 'vLLM'],
		all: providerNames,
	}


	const selectedProviderName = getSelectedProvider();
	const didFillInProviderSettings = selectedProviderName && etheranaSettingsState.settingsOfProvider[selectedProviderName]._didFillInProviderSettings
	const isApiKeyLongEnoughIfApiKeyExists = selectedProviderName && etheranaSettingsState.settingsOfProvider[selectedProviderName].apiKey ? etheranaSettingsState.settingsOfProvider[selectedProviderName].apiKey.length > 15 : true
	const isAtLeastOneModel = selectedProviderName && etheranaSettingsState.settingsOfProvider[selectedProviderName].models.length >= 1

	const didFillInSelectedProviderSettings = !!(didFillInProviderSettings && isApiKeyLongEnoughIfApiKeyExists && isAtLeastOneModel)

	const prevAndNextButtons = <div className="max-w-[600px] w-full mx-auto flex flex-col items-end">
		<div className="flex items-center gap-2">
			<PreviousButton
				onClick={() => { setPageIndex(pageIndex - 1) }}
			/>
			<NextButton
				onClick={() => { setPageIndex(pageIndex + 1) }}
			/>
		</div>
	</div>


	const lastPagePrevAndNextButtons = <div className="max-w-[600px] w-full mx-auto flex flex-col items-end">
		<div className="flex items-center gap-2">
			<PreviousButton
				onClick={() => { setPageIndex(pageIndex - 1) }}
			/>
			<PrimaryActionButton
				onClick={() => {
					etheranaSettingsService.setGlobalSetting('isOnboardingComplete', true);
					voidMetricsService.capture('Completed Onboarding', { selectedProviderName, wantToUseOption })
				}}
				ringSize={etheranaSettingsState.globalSettings.isOnboardingComplete ? 'screen' : undefined}
			>Launch Etherana Coder</PrimaryActionButton>
		</div>
	</div>


	// cannot be md
	const basicDescOfWantToUseOption: { [wantToUseOption in WantToUseOption]: string } = {
		smart: "Models with the best performance on benchmarks.",
		private: "Host on your computer or local network for full data privacy.",
		cheap: "Free and affordable options.",
		all: "",
	}

	// can be md
	const detailedDescOfWantToUseOption: { [wantToUseOption in WantToUseOption]: string } = {
		smart: "Most intelligent and best for agent mode.",
		private: "Private-hosted so your data never leaves your computer or network.",
		cheap: "Use great deals like Gemini 2.5 Pro, or self-host a model with Ollama or vLLM for free.",
		all: "",
	}

	// Modified: initialize separate provider states on initial render instead of watching wantToUseOption changes
	useEffect(() => {
		if (selectedIntelligentProvider === undefined) {
			setSelectedIntelligentProvider(providerNamesOfWantToUseOption['smart'][0]);
		}
		if (selectedPrivateProvider === undefined) {
			setSelectedPrivateProvider(providerNamesOfWantToUseOption['private'][0]);
		}
		if (selectedAffordableProvider === undefined) {
			setSelectedAffordableProvider(providerNamesOfWantToUseOption['cheap'][0]);
		}
		if (selectedAllProvider === undefined) {
			setSelectedAllProvider(providerNamesOfWantToUseOption['all'][0]);
		}
	}, []);

	// reset the page to page 0 if the user redos onboarding
	useEffect(() => {
		if (!etheranaSettingsState.globalSettings.isOnboardingComplete) {
			setPageIndex(0)
		}
	}, [setPageIndex, etheranaSettingsState.globalSettings.isOnboardingComplete])


	const contentOfIdx: { [pageIndex: number]: React.ReactNode } = {
		0: <OnboardingPageShell
			content={
				<div className='flex flex-col items-center gap-8'>
					<div className="text-3xl font-light text-center">Welcome to Etherana Coder</div>

					{/* Slice of Etherana image */}
					<div className='max-w-md w-full h-[30vh] mx-auto flex items-center justify-center'>
						{!isLinux && <EtheranaIcon />}
					</div>


					<FadeIn
						delayMs={1000}
					>
						<PrimaryActionButton
							onClick={() => { setPageIndex(1) }}
						>
							Get Started
						</PrimaryActionButton>
					</FadeIn>

				</div>
			}
		/>,

		1: <OnboardingPageShell hasMaxWidth={false}
			content={
				<AddProvidersPage pageIndex={pageIndex} setPageIndex={setPageIndex} />
			}
		/>,
		2: <OnboardingPageShell

			content={
				<div>
					<div className="text-3xl font-light text-center">Settings and Themes</div>

					<div className="mt-8 text-center flex flex-col items-center gap-4 w-full max-w-md mx-auto">
						<h4 className="text-etherana-fg-3 mb-4">Transfer your settings from an existing editor?</h4>
						<OneClickSwitchButton className='w-full px-4 py-2' fromEditor="VS Code" />
						<OneClickSwitchButton className='w-full px-4 py-2' fromEditor="Cursor" />
						<OneClickSwitchButton className='w-full px-4 py-2' fromEditor="Windsurf" />
					</div>
				</div>
			}
			bottom={lastPagePrevAndNextButtons}
		/>,
	}


	return <div key={pageIndex} className="w-full max-h-[82vh] overflow-y-auto text-left mx-auto flex flex-col items-center justify-start py-4">
		<ErrorBoundary>
			{contentOfIdx[pageIndex]}
		</ErrorBoundary>
	</div>

}
