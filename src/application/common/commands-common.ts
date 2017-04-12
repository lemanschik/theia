import { MAIN_MENU_BAR, MenuContribution, MenuModelRegistry } from './menu';
import { CommandContribution, CommandRegistry } from './command';
import { injectable } from "inversify";

export namespace CommonCommands {
    export const EDIT_MENU = "2_edit"
    export const EDIT_MENU_UNDO_GROUP = "1_undo/redo"
    export const EDIT_MENU_COPYPASTE_GROUP = "2_copy"

    export const EDIT_UNDO = monaco.editor.Handler.Undo;
    export const EDIT_REDO = monaco.editor.Handler.Redo;
}

@injectable()
export class CommonMenuContribution implements MenuContribution {

    contribute(registry: MenuModelRegistry): void {
        // Explicitly register the Edit Submenu
        registry.registerSubmenu([MAIN_MENU_BAR], CommonCommands.EDIT_MENU, "Edit");
        registry.registerMenuAction([MAIN_MENU_BAR, CommonCommands.EDIT_MENU, CommonCommands.EDIT_MENU_UNDO_GROUP], {
            commandId: CommonCommands.EDIT_UNDO
        });
        registry.registerMenuAction([
            MAIN_MENU_BAR,
            CommonCommands.EDIT_MENU,
            CommonCommands.EDIT_MENU_UNDO_GROUP], {
                commandId: CommonCommands.EDIT_REDO
            });
    }

}

@injectable()
export class CommonCommandContribution implements CommandContribution {

    contribute(commandRegistry: CommandRegistry): void {
        commandRegistry.registerCommand({
            id: CommonCommands.EDIT_UNDO,
            label: 'Undo'
        })
        commandRegistry.registerCommand({
            id: CommonCommands.EDIT_REDO,
            label: 'Redo'
        })
    }

}