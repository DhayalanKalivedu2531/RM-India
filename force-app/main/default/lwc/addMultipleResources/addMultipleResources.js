import { LightningElement, track, wire, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import FetchSavedResources from '@salesforce/apex/AddResourceMultipleController.fetchSavedResources';
import getTeamValues from '@salesforce/apex/AddResourceMultipleController.getTeamValues';
import fetchTeamsResource from '@salesforce/apex/AddResourceMultipleController.fetchTeamsResource';
import validateProjectDateRange from '@salesforce/apex/AddResourceMultipleController.validateProjectDateRange';
import addingResourceToProject from '@salesforce/apex/AddResourceMultipleController.addingResourceToProject';
import fetchTotalAvailableResource from '@salesforce/apex/AddResourceMultipleController.fetchTotalAvailableResource';
import { getPicklistValues } from 'lightning/uiObjectInfoApi';
import ResourceStatus from '@salesforce/schema/Project_Resource__c.Status__c';
import ProjectRole from '@salesforce/schema/Project_Resource__c.Project_Role__c';
import Allocationunit from '@salesforce/schema/Project_Resource__c.Allocation_Unit__c';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import RESOURCE_OBJECT from '@salesforce/schema/Project_Resource__c';
import { CurrentPageReference } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import sucessToast from '@salesforce/label/c.Sucess_AddResource';
export default class addMultipleResources extends NavigationMixin(LightningElement) {
    @track contactList = [];
    recordId;
    selectedValueChange;
    selectedValue = true;
    @track teamDynamicOptions = [];
    selectedTeamName;
    showTeamNameData = false;
    teamResourceList = [];
    @track selectedRows = [];
    resourceRoleValue = [];
    resourceActiveValue = [];
    allocationChange = [];
    unitValue = [];
    startDateValue = [];
    endDateValue = [];
    nonBillableReason = [];
    billableData = [];
    showSpinner = true;
    showDataSpinner = true;
    teamNotSelect = true;
    hidetTotalData = true;
    projectStartDateValidator;
    projectEndDateValidator;
    showSearchData = true;
    @track availableResources;
    @track practiceData = [];
    isSelectedActionExpand = false;

    get options() {
        return this.teamDynamicOptions;
    }

    get toggleLabel() {
        return this.isSelectedActionExpand ? 'Collapse All' : 'Select All Team';
    }

    get disable() {
        return (this.selectedTeamName) ? false : true;
    }
    get showSaveButton() {
        return this.selectedRows.length > 0 || this.finaldata.length > 0;
    }
    get showNoResource() {
        return this.finalTeamResourcesearch.length <= 0;
    }

    @wire(CurrentPageReference)
    getStateParameters(currentPageReference) {
        if (currentPageReference) {
            this.recordId = currentPageReference.state?.c__recordId;
            console.log('stored id=' + this.recordId);
        }
    }

    @wire(getObjectInfo, { objectApiName: RESOURCE_OBJECT })
    contactInfo;

    @wire(getPicklistValues, {
        recordTypeId: '$contactInfo.data.defaultRecordTypeId',
        fieldApiName: ResourceStatus
    })
    resourceourceValues;

    @wire(getObjectInfo, { objectApiName: RESOURCE_OBJECT })
    roleInfos;

    @wire(getPicklistValues, {
        recordTypeId: '$roleInfos.data.defaultRecordTypeId',
        fieldApiName: ProjectRole
    })
    projectRoleValues;

    @wire(getObjectInfo, { objectApiName: RESOURCE_OBJECT })
    unitInfos;

    @wire(getPicklistValues, {
        recordTypeId: '$unitInfos.data.defaultRecordTypeId',
        fieldApiName: Allocationunit
    })
    allocationUnitValues;


    connectedCallback() {
        this.fetchData();
        getTeamValues().then(response => {
            let arr = [];
            for (var i = 0; i < response.length; i++) {
                arr.push({ label: response[i].Name, value: response[i].Name });
            }
            this.teamDynamicOptions = arr;
        });

        fetchTotalAvailableResource({ projectIds: this.recordId })
            .then((result) => {
                this.availableResources = result.fetchAllResourceDetails;
                if (this.availableResources) {
                    this.prepareDataForAccordion();
                }
            })
            .catch((error) => {
                console.log('Error:', error);
            });

        validateProjectDateRange({ projectIds: this.recordId }).then(res => {
            for (let item of res) {
                this.projectStartDateValidator = item.startDateValidation;
                this.projectEndDateValidator = item.endDateValidation;
            }

        })
            .catch(error => {
                console.error('Error:', JSON.stringify(error));
            });

    }

    // METHOD TO PREPARE DATA FOR ACCORDION
    prepareDataForAccordion() {
        let practiceMap = new Map();
        let teamsSet = new Set();
        this.availableResources.forEach((resource) => {
            let practiceName = resource.Practice__r.Name;
            teamsSet.add(practiceName);
            if (!practiceMap.has(practiceName)) {
                practiceMap.set(practiceName, { records: [] });
            }
            practiceMap.get(practiceName).records.push(resource);
        });

        this.teamsName = Array.from(teamsSet).map((teamName) => ({ label: teamName, value: teamName }));
        this.teamsName.unshift({ label: 'None', value: '' });
        this.practiceData = [];
        this.finalTeamResourcesearch = [];
        practiceMap.forEach((value, key) => {
            let filteredRecords = value.records;
            if (filteredRecords.length > 0) {
                this.practiceData.push({
                    label: key,
                    name: key,
                    records: filteredRecords,
                });
                this.finalTeamResourcesearch.push({
                    label: key,
                    name: key,
                    records: filteredRecords,
                });
            }
        });
        console.log(JSON.stringify(this.finalTeamResourcesearch));
    }

    // ATTRIBUTES AND METHODS FOR EXPAND AND COLLAPSE
    @track activeSections = [];

    handleActionChange(event) {
        this.isSelectedActionExpand = event.target.checked;
        if (this.isSelectedActionExpand) {
            this.hidetTotalData = true;
            this.showTeamNameData = false;
            this.teamNotSelect = true;
            this.showSearchData = true;
        }
        if (this.isSelectedActionExpand == true) {
            this.handleExpandAll();
        } else if (this.isSelectedActionExpand == false) {
            this.handleCollapseAll();
        }
    }

    handleExpandAll() {
        const allSectionNames = this.practiceData.map((practice) => practice.name);
        this.activeSections = allSectionNames;
        this.teamNotSelect = true;
    }

    handleCollapseAll() {
        this.activeSections = [];
        this.teamNotSelect = false;
    }
    resourceAvailableData = true;

    handleChangedvalue(event) {
        const teamvalue = event.target.value;
        if (teamvalue) {
            this.hidetTotalData = false;
            this.showSearchData = false;
            this.isSelectedActionExpand = false;
        }
        this.selectedTeamName = teamvalue;
        if (this.selectedTeamName) {
            this.showTeamNameData = true;
            this.teamNotSelect = false;
            this.showSpinner = true;

            fetchTeamsResource({ teamName: this.selectedTeamName, projectId: this.recordId }).then(result => {
                this.teamResourceList = result[0].listOfContacts;
                this.searchList = result[0].listOfContacts;

                if (this.searchList && this.searchList.length > 0) {
                    this.resourceAvailableData = false;
                } else {
                    this.resourceAvailableData = true;
                }
                setTimeout(() => {
                    this.showSpinner = false;
                }, 2000);
                if (this.teamResourceList) {
                    this.teamNotSelect = false;
                }
            });
        }
    }
    handleNameClick(event) {
        const recordId = event.currentTarget.dataset.itemId;
        console.log(JSON.stringify(recordId));
        const baseUrl = '/lightning/r/Contact/' + recordId + '/view';
        window.open(baseUrl, '_blank');
    }

    handleSelectChange(event) {
        this.selectedValueChange = event.target.value;
        console.log(this.selectedValueChange);
    }

    handleToggleChange(event) {
        this.selectedValue = event.target.checked;
        this.fetchData();
    }
    finaldata = [];
    handlevalues(event) {
        let input = event.target.dataset.input;
        let index = event.target.dataset.index;
        let data = this.contactList[index];
        let recordId = data.Id;
        if (input == 'status') {
            data.Status__c = event.target.value;
        } else if (input == 'role') {
            data.Project_Role__c = event.target.value;
        } else if (input == 'allocation') {
            data.Allocation__c = event.target.value;
        } else if (input == 'unit') {
            data.Allocation_Unit__c = event.target.value;
        } else if (input == 'startdate') {
            data.Start_Date__c = event.target.value;
        } else if (input == 'enddate') {
            data.End_Date__c = event.target.value;
        }

        let existingIndex = this.finaldata.findIndex(item => item.Id === recordId);

        if (existingIndex !== -1) {
            this.finaldata[existingIndex] = data;
        } else {
            this.finaldata.push(data);
        }
    }

    fetchData() {
        FetchSavedResources({ projectIdValues: this.recordId, toggleValue: this.selectedValue }).then(res => {
            this.contactList = res[0].listOfResource;
            if (this.contactList) {
                this.showDataSpinner = false;

            }
        });
    }

    handleRoleValue(event) {
        let rolevalue = event.target.dataset.role;
        this.resourceRoleValue[rolevalue] = event.target.value;
    }
    handleActiveChange(event) {
        let statusvalue = event.target.dataset.status;
        this.resourceActiveValue[statusvalue] = event.target.value;
    }
    handleAllocationvalue(event) {
        let allocationInd = event.target.dataset.allocation;
        this.allocationChange[allocationInd] = event.target.value;
    }
    handleunitChange(event) {
        let unitproperty = event.target.dataset.unit;
        this.unitValue[unitproperty] = event.target.value;
    }
    handlestartDateChange(event) {
        let startvalue = event.target.dataset.start;
        this.startDateValue[startvalue] = event.target.value;
        console.log(JSON.stringify(this.startDateValue));
    }
    handleEndDateChange(event) {
        let endvalue = event.target.dataset.end;
        this.endDateValue[endvalue] = event.target.value;
    }


    handleRemoveSelected(event) {
        const itemId = event.target.dataset.itemId;
        this.selectedRows = this.selectedRows.filter((item) => item.Id != itemId);
        let element = this.template.querySelector("[data-elementid='" + itemId + "']");
        if (element != null) {
            element.checked = false
        }
    }

    handlecheckboxvalue(event) {
        const selectedItemId = event.target.dataset.itemId;
        const selectedItem = this.teamResourceList.find(item => item.Id === selectedItemId);
        const isChecked = event.target.checked;

        if (isChecked) {
            this.selectedRows.push(selectedItem);
        } else {
            const indexToRemove = this.selectedRows.findIndex(item => item.Id === selectedItemId);
            if (indexToRemove !== -1) {
                this.selectedRows.splice(indexToRemove, 1);
            }
        }
    }


    handleCheck(event) {
        const itemId = event.target.dataset.itemId;
        const index = event.target.dataset.index;
        const group = event.target.dataset.group;
        const practice = this.finalTeamResourcesearch.find((item) => item.name === group);

        if (practice && practice.records[index]) {
            practice.records[index].selected = event.target.checked;

            if (event.target.checked) {
                this.selectedRows.push(practice.records[index]);
            } else {
                this.selectedRows = this.selectedRows.filter(
                    (resource) => resource.Id !== practice.records[index].Id
                );
            }
        }

    }

    handleClick(event) {
        addingResourceToProject({
            resourceAllocationValues: this.allocationChange, resourceIds: this.selectedRows, startDates: this.startDateValue, endDates: this.endDateValue, projectRoles: this.resourceRoleValue,
            allocationUnits: this.unitValue, statusValues: this.resourceActiveValue, projectId: this.recordId,
            startDateValidate: this.projectStartDateValidator, endDateValidate: this.projectEndDateValidator, existResourceData: this.finaldata
        })
            .then(res => {
                const evt = new ShowToastEvent({
                    title: 'Success',
                    message: sucessToast,
                    variant: 'success'
                })
                this.dispatchEvent(evt);
                this.updateRecordView();
            }).catch(error => {
                let errorMessage = error.body.message; 
                if (errorMessage.includes("FIELD_CUSTOM_VALIDATION_EXCEPTION")  || errorMessage.includes("REQUIRED_FIELD_MISSING")) {
                    const startIndex = errorMessage.indexOf(',') + 2;
                    const endIndex = errorMessage.lastIndexOf(':'); 
                    errorMessage = errorMessage.substring(startIndex, endIndex).trim();
                }

                const event = new ShowToastEvent({
                    title: 'Error',
                    message: errorMessage,
                    variant: 'error'
                });
                this.dispatchEvent(event);
            });


    }
    updateRecordView() {
        setTimeout(() => {
            location.reload();
        }, 1000);
    }
    searchList = [];

    handleSearchOnChange(event) {
        let searchKey = event.target.value.trim().toLowerCase();
        if (searchKey.length > 1) {
            this.searchList = this.teamResourceList.filter(item => {
                return item.LastName.toLowerCase().includes(searchKey);
            });

        } else {
            this.searchList = this.teamResourceList;
        }


    }

    @track finalTeamResourcesearch = [];
    @track searchKey = '';

    handleSearchOnteamResource(event) {
        let searchKey = event.target.value.trim().toLowerCase();
        this.finalTeamResourcesearch = [];
        for (let item of this.practiceData) {
            const filteredRecords = item.records.filter(record => {
                return record.LastName.toLowerCase().includes(searchKey);
            });
            if (filteredRecords.length > 0) {
                let practiceCopy = { ...item };
                practiceCopy.records = filteredRecords;
                this.finalTeamResourcesearch.push(practiceCopy);
            }
        }
    }



}