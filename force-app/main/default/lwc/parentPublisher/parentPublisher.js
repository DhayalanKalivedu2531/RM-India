import { LightningElement, wire } from 'lwc';
import gettingAccountDetails from '@salesforce/apex/PubsubController.gettingAccountDetails';
import {CurrentPageReference} from 'lightning/navigation';
import {fireEvent} from 'c/pubsub';
export default class ParentPublisher extends LightningElement {
    accountDetails = []; // This List is used to  Store the List of Account Data..
    selectedRows = []; // This List is used to Store the Selected Row Details...
    selectedIds = [];
    passSelectedId = false;
    @wire(CurrentPageReference) pageRef;
    @wire(gettingAccountDetails)
    response({ data, error }) {
        if (data) {
            this.accountDetails = data;
        }
        else if (error) {
            console.log('Error');
        }
    }

    handlecheckboxvalue(event) {
        const selectedItemId = event.target.dataset.itemId;
        const selectedItem = this.accountDetails.find(item => item.Id === selectedItemId);
        const isChecked = event.target.checked;

        if (isChecked) {
            this.selectedRows.push(selectedItem);
            console.log('Selected Id=' + JSON.stringify(this.selectedRows));
        } else {
            const indexToRemove = this.selectedRows.findIndex(item => item.Id === selectedItemId);
            if (indexToRemove !== -1) {
                this.selectedRows.splice(indexToRemove, 1);
                console.log('Remaining Id=', JSON.stringify(this.selectedRows));
            }
        }
        if(this.selectedRows.length > 0) {
               this.passSelectedId = true;
        } else {
            this. passSelectedId = false;
        }
        
    }
    handleNameClick(event) {
        const selectedRecordId = event.target.dataset.itemId;
        const baseUrl = '/lightning/r/Account/' + selectedRecordId + '/view';
        window.open(baseUrl, '_blank');
    }
    handleRelatedContact() {
        this.selectedIds = this.selectedRows.map(res => res.Id); 
        fireEvent(this.pageRef, 'publisherAccountId', this.selectedIds);
    }

}