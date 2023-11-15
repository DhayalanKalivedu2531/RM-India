import { LightningElement, wire } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import { registerListener } from 'c/pubsub';
import getContactDetails from '@salesforce/apex/PubsubController.getContactDetails';
import newCaseCreation from '@salesforce/apex/PubsubController.newCaseCreation';
import { getPicklistValues } from 'lightning/uiObjectInfoApi';
import CASE_OBJECT from '@salesforce/schema/Case';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import StatusValue from '@salesforce/schema/Case.Status';
import OriginStatus from '@salesforce/schema/Case.Origin';
import CaseReason from '@salesforce/schema/Case.Reason';
import TypeReason from '@salesforce/schema/Case.Type';
import 	PriorityValue from '@salesforce/schema/Case.Priority';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
export default class ChildSubscriber extends LightningElement {
    publisherAccountids = [];
    relatedContactData = [];
    showData = false;
    accountNameValue = '';
    contactNameValue = '';
    caseStatus;
    caseOrigin;
    caseType = '';
    caseReason = '';
    casePriority = '';
    caseAcccountId = '';
    caseContactId = '';
    @wire(CurrentPageReference) pageRef;

    @wire(getObjectInfo, { objectApiName: CASE_OBJECT })
    caseInfo;

    @wire(getPicklistValues, {
        recordTypeId: '$caseInfo.data.defaultRecordTypeId',
        fieldApiName: StatusValue
    })
    statusValues;

    @wire(getObjectInfo, { objectApiName: CASE_OBJECT })
    caseOriginInfo;
    @wire(getPicklistValues, {
        recordTypeId: '$caseOriginInfo.data.defaultRecordTypeId',
        fieldApiName: OriginStatus
    })
    originValues;
    @wire(getObjectInfo, { objectApiName: CASE_OBJECT })
    caseReasonInfo;

    @wire(getPicklistValues, {
        recordTypeId: '$caseReasonInfo.data.defaultRecordTypeId',
        fieldApiName: CaseReason
    })
    reasonValues;
    @wire(getObjectInfo, { objectApiName: CASE_OBJECT })
    caseTypeInfo;

    @wire(getPicklistValues, {
        recordTypeId: '$caseTypeInfo.data.defaultRecordTypeId',
        fieldApiName: TypeReason
    })
    TypeValues;
     @wire(getObjectInfo, { objectApiName: CASE_OBJECT })
    casePriorityInfo;

    @wire(getPicklistValues, {
        recordTypeId: '$casePriorityInfo.data.defaultRecordTypeId',
        fieldApiName: PriorityValue
    })
    PriorityValues;

    connectedCallback() {
        registerListener('publisherAccountId', this.handleContactDetails, this);
    }
    handleContactDetails(data) {
        this.publisherAccountids = data;
        getContactDetails({ listOfAccountIdValue: this.publisherAccountids }).then(res => {
            this.relatedContactData = res;
        })
        if (this.relatedContactData.length >= 0) {
            this.showData = true;
        }
        else {
            this.showData = false;
        }
    }
    handleNameClick(event) {
        const selectedId = event.target.dataset.itemId;
        const baseUrl = '/lightning/r/Account/' + selectedId + '/view';
        window.open(baseUrl, '_blank');
    }
    selectedRows = [];
    disabledData = false;
    handlecheckboxvalue(event) {
        const selectedItemId = event.target.dataset.itemId;
        const selectedItem = this.relatedContactData.find(item => item.Id === selectedItemId);
        const isChecked = event.target.checked;

        if (isChecked) {
            this.selectedRows.push(selectedItem);
        } else {
            const indexToRemove = this.selectedRows.findIndex(item => item.Id === selectedItemId);
            if (indexToRemove !== -1) {
                this.selectedRows.splice(indexToRemove, 1);
            }
        }
        if (this.selectedRows.length > 0) {
            this.showCreation = true;
        }
        else {
            this.showCreation = false;
        }
    }
    showCreateCase = false;
    showCreation = false;
    handleClick() {
        this.showCreateCase = true;
        this.selectedRows.forEach(res => {
             this.accountNameValue = res.Account.Name;
             this.contactNameValue = res.Name;
             this.caseAcccountId = res.AccountId;
             this.caseContactId = res.Id;
        });
    }
    handleClosePop() {
        this.showCreateCase = false;
    }
    handleOrigin(event) {
        this.caseOrigin = event.target.value;
    }
    handleStatus(event) {
        this.caseStatus = event.target.value;
    }
    handleReason(event) {
        this.caseReason = event.target.value;
    }
    handleType(event) {
        this.caseType = event.target.value;
    }
    handlePriority(event) {
        this.casePriority = event.target.value;
    }
    handleCreationNewCase() {
        if(this.caseStatus != null && this.caseOrigin != null) {
          newCaseCreation({Origin : this.caseOrigin, Status: this.caseStatus, Priority: this.casePriority, Reason: this.casePriority, Type: this.caseType, accountId: this.caseAcccountId, contactId: this.caseContactId}).then(res =>{
              const evt = new ShowToastEvent({
                    title: 'Case Created Successfully',
                    variant: 'success'
                })
                this.dispatchEvent(evt);
                this.updateRecordView();
          });
        }
        else {
           const evt = new ShowToastEvent({
                    title: 'Error',
                    message: 'Please Give The Required Field Value',
                    variant: 'error'
                })
                this.dispatchEvent(evt);
        }
    }
    updateRecordView() {
        setTimeout(() => {
            location.reload();
        }, 1000);
    }
}