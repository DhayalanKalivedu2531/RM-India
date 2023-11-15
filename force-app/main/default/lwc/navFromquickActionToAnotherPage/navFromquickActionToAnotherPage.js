import { LightningElement, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { CloseActionScreenEvent } from "lightning/actions";

export default class NavFromquickActionToAnotherPage extends NavigationMixin(LightningElement) {
  _recordId;

    @api set recordId(value) {
        this._recordId = value;
        console.log('record id is ' + this._recordId);

        this.generateUrlAndOpenTab();
    }

    get recordId() {
        return this._recordId;
    }

    async generateUrlAndOpenTab() {
        const generatedUrl = await this[NavigationMixin.GenerateUrl]({
            type: 'standard__navItemPage',
            attributes: {
                apiName: 'AddmultipleResource'
            },
            state: {
                c__recordId: this._recordId
            }
        });

        const newTab = window.open(generatedUrl, '_blank');

         newTab.focus();
         this.dispatchEvent(new CloseActionScreenEvent());

    }

}