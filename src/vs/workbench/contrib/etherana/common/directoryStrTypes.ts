import { URI } from '../../../../base/common/uri.js';

export type EtheranaDirectoryItem = {
	uri: URI;
	name: string;
	isSymbolicLink: boolean;
	children: EtheranaDirectoryItem[] | null;
	isDirectory: boolean;
	isGitIgnoredDirectory: false | { numChildren: number }; // if directory is gitignored, we ignore children
}
