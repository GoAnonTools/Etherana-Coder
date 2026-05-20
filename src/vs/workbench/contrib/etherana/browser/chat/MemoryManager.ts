import { FeatureName } from '../../common/etheranaSettingsTypes.js';
import { IEtheranaSettingsService } from '../../common/etheranaSettingsService.js';
import { IProjectMemoryService } from '../projectMemoryService.js';
import { IEtheranaCommandBarService } from '../etheranaCommandBarService.js';

export class MemoryManager {
    constructor(
        private readonly _settingsService: IEtheranaSettingsService,
        private readonly _projectMemoryService: IProjectMemoryService,
        private readonly _etheranaCommandBarService: IEtheranaCommandBarService,
    ) {}

    public getProjectMemoryContext(options: { mode: FeatureName }): { content: string, metadata: any } | null {
        const settings = this._settingsService.state.globalSettings.projectMemory;
        if (!settings || !settings.enabled) return null;

        // Check if enabled for this mode
        if (options.mode === 'Chat' && !settings.includeInChat) return null;
        if (options.mode === 'Gather' && !settings.includeInGather) return null;
        if (options.mode === 'Agent' && !settings.includeInAgent) return null;
        if (options.mode === 'Autocomplete' && !settings.includeInAutocomplete) return null;
        
        // For other features (Review, SCM, etc.), we'll use Chat settings as a fallback for now
        if (['Review', 'Ctrl+K', 'Apply', 'SCM'].includes(options.mode as string) && !settings.includeInChat) return null;

        const activeUri = this._etheranaCommandBarService.activeURI;
        const filePaths = activeUri ? [activeUri.fsPath] : [];

        // Get relevant entries
        const entries = this._projectMemoryService.getRelevantEntries({
            filePaths,
            limit: settings.maxEntriesPerRequest,
            preferUserConfirmed: settings.preferUserConfirmed
        });

        if (entries.length === 0) return null;

        const content = entries.map(e => `[${e.type.toUpperCase()}] ${e.title}: ${e.summary}`).join('\n');
        
        // Mark entries as used (batch update)
        this._projectMemoryService.markEntriesUsed(entries.map(e => e.id));

        return {
            content,
            metadata: {
                projectMemoryIncluded: true,
                projectMemoryEntryIds: entries.map(e => e.id),
                projectMemoryEntryCount: entries.length,
                projectMemoryStatus: 'included'
            }
        };
    }
}
