import { MessageContext, publish } from 'lightning/messageService';
import { LightningElement, wire } from 'lwc';
import serviceChannel from '@salesforce/messageChannel/serviceChannel__c';
export default class ParentLMSPublisher extends LightningElement {
    name = '';
    @wire (MessageContext) messageContext;
    handleChange(event) {
        this.name = event.target.value;
        let payload = {dataload : this.name};
        publish(this.messageContext, serviceChannel, payload);
    }

}