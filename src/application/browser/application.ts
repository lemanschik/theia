import "reflect-metadata";
import { Application } from "@phosphor/application";
import { ApplicationShell } from "./shell";
import {injectable, multiInject, inject} from "inversify";
import {CommandRegistry} from "../common/command";

export const TheiaPlugin = Symbol("TheiaPlugin");
/**
 * Clients can subclass to get a callback for contributing widgets to a shell on start.
 */
export interface TheiaPlugin {

    /**
     * Callback
     */
    onStart(app: TheiaApplication): void;
}

@injectable()
export class TheiaApplication {

    readonly shell: ApplicationShell;
    private application: Application<ApplicationShell>;

    constructor(
        @inject(CommandRegistry) commandRegistry: CommandRegistry,
        @multiInject(TheiaPlugin) contributions: TheiaPlugin[]) {

        this.shell = new ApplicationShell();
        this.application = new Application<ApplicationShell>({
            shell: this.shell
        });
        this.application.started.then(() => {
            contributions.forEach(c => c.onStart(this));
        })
    }

    start(): Promise<void> {
        return this.application.start();
    }
}