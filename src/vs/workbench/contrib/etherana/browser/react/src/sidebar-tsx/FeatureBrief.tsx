/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import React, { useState, useEffect } from 'react';
import { useAccessor } from '../util/services.js';
import { Sparkles, Copy, X, Loader2, CheckCircle2, Share2, ClipboardList } from 'lucide-react';
import { ChatMarkdownRender } from '../markdown/ChatMarkdownRender.js';

interface FeatureBriefProps {
	threadId: string;
	onClose: () => void;
}

export const FeatureBrief = ({ threadId, onClose }: FeatureBriefProps) => {
	const [brief, setBrief] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isCopied, setIsCopied] = useState(false);
	const accessor = useAccessor();
	const chatThreadService = accessor.get('IChatThreadService');

	useEffect(() => {
		let isMounted = true;
		chatThreadService.generateFeatureBrief(threadId).then(content => {
			if (isMounted) {
				setBrief(content);
				setIsLoading(false);
			}
		});
		return () => { isMounted = false; };
	}, [threadId, chatThreadService]);

	const handleCopy = () => {
		if (brief) {
			navigator.clipboard.writeText(brief);
			setIsCopied(true);
			setTimeout(() => setIsCopied(false), 2000);
		}
	};

	return (
		<div className="etherana-fixed etherana-inset-0 etherana-bg-black/60 etherana-backdrop-blur-sm etherana-z-[1000] etherana-flex etherana-items-center etherana-justify-center etherana-p-6">
			<div className="etherana-bg-etherana-bg-1 etherana-border etherana-border-etherana-border-1 etherana-rounded-2xl etherana-shadow-2xl etherana-max-w-2xl etherana-w-full etherana-max-h-[85vh] etherana-flex etherana-flex-col etherana-overflow-hidden">
				
				{/* Header */}
				<div className="etherana-p-6 etherana-border-b etherana-border-etherana-border-2 etherana-flex etherana-items-center etherana-justify-between etherana-bg-gradient-to-r etherana-from-blue-600/10 etherana-to-transparent">
					<div className="etherana-flex etherana-items-center etherana-gap-3">
						<div className="etherana-p-2 etherana-bg-blue-600/20 etherana-rounded-lg">
							<Sparkles className="etherana-size-5 etherana-text-blue-500" />
						</div>
						<div>
							<h2 className="etherana-text-lg etherana-font-bold">Feature Brief</h2>
							<p className="etherana-text-xs etherana-text-etherana-fg-4">AI-generated summary of your recent work</p>
						</div>
					</div>
					<button 
						onClick={onClose}
						className="etherana-p-2 etherana-rounded-lg hover:etherana-bg-white/10 etherana-transition-colors"
					>
						<X className="etherana-size-5" />
					</button>
				</div>

				{/* Content */}
				<div className="etherana-flex-1 etherana-overflow-y-auto etherana-p-8">
					{isLoading ? (
						<div className="etherana-flex etherana-flex-col etherana-items-center etherana-justify-center etherana-py-12 etherana-gap-4">
							<Loader2 className="etherana-size-10 etherana-text-blue-500 etherana-animate-spin" />
							<p className="etherana-text-sm etherana-text-etherana-fg-3 etherana-animate-pulse">Analyzing session events and generating brief...</p>
						</div>
					) : (
						<div className="etherana-prose etherana-prose-invert etherana-max-w-none">
							<ChatMarkdownRender 
								string={brief || ''} 
								chatMessageLocation={undefined}
							/>
						</div>
					)}
				</div>

				{/* Footer */}
				{!isLoading && (
					<div className="etherana-p-6 etherana-border-t etherana-border-etherana-border-2 etherana-bg-etherana-bg-2/50 etherana-flex etherana-items-center etherana-justify-between">
						<div className="etherana-flex etherana-items-center etherana-gap-2 etherana-text-xs etherana-text-etherana-fg-4">
							<ClipboardList className="etherana-size-4" />
							<span>Perfect for commit messages or stand-ups</span>
						</div>
						<div className="etherana-flex etherana-items-center etherana-gap-3">
							<button 
								onClick={onClose}
								className="etherana-px-4 etherana-py-2 etherana-rounded-lg etherana-text-xs etherana-font-bold hover:etherana-bg-white/10 etherana-transition-colors"
							>
								Close
							</button>
							<button 
								onClick={handleCopy}
								className="etherana-flex etherana-items-center etherana-gap-2 etherana-px-6 etherana-py-2 etherana-rounded-lg etherana-bg-blue-600 hover:etherana-bg-blue-500 etherana-text-white etherana-text-xs etherana-font-bold etherana-transition-all etherana-shadow-lg etherana-shadow-blue-600/20"
							>
								{isCopied ? (
									<>
										<CheckCircle2 className="etherana-size-4" />
										Copied!
									</>
								) : (
									<>
										<Share2 className="etherana-size-4" />
										Copy Brief
									</>
								)}
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};
