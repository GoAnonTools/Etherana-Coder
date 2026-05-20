/*--------------------------------------------------------------------------------------
 *  © 2026 GoAnon. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { WarningBox } from '../etherana-settings-tsx/WarningBox.js';

interface Props {
	children: ReactNode;
	fallback?: ReactNode;
	onDismiss?: () => void;
}

interface State {
	hasError: boolean;
	error: Error | null;
	errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = {
			hasError: false,
			error: null,
			errorInfo: null
		};
	}

	static getDerivedStateFromError(error: Error): Partial<State> {
		return {
			hasError: true,
			error
		};
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
		this.setState({
			error,
			errorInfo
		});
	}

	public reset = () => {
		this.setState({
			hasError: false,
			error: null,
			errorInfo: null
		});
		this.props.onDismiss?.();
	}

	render(): ReactNode {
		if (this.state.hasError && this.state.error) {
			// If a custom fallback is provided, use it
			if (this.props.fallback) {
				return this.props.fallback;
			}

			// Use ErrorDisplay component as the default error UI
			return (
				<div className="flex flex-col gap-2">
					<WarningBox text={this.state.error.message || this.state.error + ''} />
					<button
						className="mx-4 mb-2 py-1 px-3 bg-white/10 hover:bg-white/20 rounded text-[10px] uppercase tracking-wider font-bold text-etherana-fg-3 transition-colors"
						onClick={this.reset}
					>
						Retry Component
					</button>
				</div>
			);
		}

		return this.props.children;
	}
}

export default ErrorBoundary;
