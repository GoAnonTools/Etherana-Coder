/*--------------------------------------------------------------------------------------
 *  © 2026 GoAnon. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import React, { ButtonHTMLAttributes, useEffect, useState } from 'react';

export const IconX = ({ size, className = '', ...props }: { size: number, className?: string } & React.SVGProps<SVGSVGElement>) => (
	<svg
		xmlns='http://www.w3.org/2000/svg'
		width={size}
		height={size}
		viewBox='0 0 24 24'
		fill='none'
		stroke='currentColor'
		className={className}
		{...props}
	>
		<path
			strokeLinecap='round'
			strokeLinejoin='round'
			d='M6 18 18 6M6 6l12 12'
		/>
	</svg>
);

export const IconArrowUp = ({ size, className = '' }: { size: number, className?: string }) => (
	<svg
		width={size}
		height={size}
		className={className}
		viewBox="0 0 20 20"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
	>
		<path
			fill="black"
			fillRule="evenodd"
			clipRule="evenodd"
			d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
		></path>
	</svg>
);

export const IconSquare = ({ size, className = '' }: { size: number, className?: string }) => (
	<svg
		className={className}
		stroke="black"
		fill="black"
		strokeWidth="0"
		viewBox="0 0 24 24"
		width={size}
		height={size}
		xmlns="http://www.w3.org/2000/svg"
	>
		<rect x="2" y="2" width="20" height="20" rx="4" ry="4" />
	</svg>
);

export const IconWarning = ({ size, className = '' }: { size: number, className?: string }) => (
	<svg
		className={className}
		stroke="currentColor"
		fill="currentColor"
		strokeWidth="0"
		viewBox="0 0 16 16"
		width={size}
		height={size}
		xmlns="http://www.w3.org/2000/svg"
	>
		<path
			fillRule="evenodd"
			clipRule="evenodd"
			d="M7.56 1h.88l6.54 12.26-.44.74H1.44L1 13.26 7.56 1zM8 2.28L2.28 13H13.7L8 2.28zM8.625 12v-1h-1.25v1h1.25zm-1.25-2V6h1.25v4h-1.25z"
		/>
	</svg>
);

export const IconLoading = ({ className = '' }: { className?: string }) => {
	const [loadingText, setLoadingText] = useState('.');

	useEffect(() => {
		const intervalId = setInterval(() => {
			setLoadingText(prev => prev === '...' ? '.' : prev + '.');
		}, 300);

		return () => clearInterval(intervalId);
	}, []);

	return <div className={`${className}`}>{loadingText}</div>;
};

const DEFAULT_BUTTON_SIZE = 22;

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>

export const ButtonSubmit = ({ className, disabled, ...props }: ButtonProps & Required<Pick<ButtonProps, 'disabled'>>) => (
	<button
		type='button'
		className={`rounded-full flex-shrink-0 flex-grow-0 flex items-center justify-center
			${disabled ? 'bg-vscode-disabled-fg cursor-default' : 'bg-white cursor-pointer'}
			${className}
		`}
		{...props}
	>
		<IconArrowUp size={DEFAULT_BUTTON_SIZE} className="stroke-[2] p-[2px]" />
	</button>
);

export const ButtonStop = ({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) => (
	<button
		className={`rounded-full flex-shrink-0 flex-grow-0 cursor-pointer flex items-center justify-center
			bg-white
			${className}
		`}
		type='button'
		{...props}
	>
		<IconSquare size={DEFAULT_BUTTON_SIZE} className="stroke-[3] p-[7px]" />
	</button>
);
