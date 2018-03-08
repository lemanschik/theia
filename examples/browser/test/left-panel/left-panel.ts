/*
 * Copyright (C) 2017 Ericsson and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import "webdriverio";

export class LeftPanel {

    constructor(protected readonly driver: WebdriverIO.Client<void>) { }

    doesTabExist(tabName: string): boolean {
        return this.driver.element(`.p-TabBar.theia-app-left .p-TabBar-content`).isExisting(`div\=${tabName}`);
    }

    isTabActive(tabName: string): boolean {
        const tab = this.driver.element(`.p-TabBar.theia-app-left .p-TabBar-content`).element(`div\=${tabName}`);
        /* Check if the parent li container has the p-mod-current class which makes it active */
        return (tab.$(`..`).getAttribute('class').split(' ').indexOf('p-mod-current') !== -1);
    }

    openCloseTab(tabName: string) {
        this.driver.element(`.p-TabBar.theia-app-left .p-TabBar-content`).click(`div\=${tabName}`);
        // Wait for animations to finish
        this.driver.pause(300);
    }

    collapseTab(tabName: string) {
        this.driver.element(`.p-TabBar.theia-app-left .p-TabBar-content`).rightClick(`div\=${tabName}`);
        this.driver.element(`.p-Widget.p-Menu .p-Menu-content`).click(`div\=Collapse`);
    }

    isFileTreeVisible(): boolean {
        return (this.driver.element('#files').getAttribute('class').split(' ').indexOf('p-mod-hidden') === -1)
            && this.isPanelVisible();
    }

    isGitContainerVisible(): boolean {
        return (this.driver.element('#theia-gitContainer').getAttribute('class').split(' ').indexOf('p-mod-hidden') === -1)
            && this.isPanelVisible();
    }

    isExtensionTabVisible(): boolean {
        return (this.driver.element('#extensions').getAttribute('class').split(' ').indexOf('p-mod-hidden') === -1)
            && this.isPanelVisible();
    }

    protected isPanelVisible(): boolean {
        return (this.driver.element('#theia-left-side-panel').getAttribute('class').split(' ').indexOf('p-mod-hidden') === -1);
    }
}
