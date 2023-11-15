import { MessageContext, subscribe } from 'lightning/messageService';
import { LightningElement, wire} from 'lwc';
import serviceChannel from '@salesforce/messageChannel/serviceChannel__c';
export default class ChildLMSSubscriber extends LightningElement {
    name = '';
    @wire(MessageContext)messageContext;
    connectedCallback() {
        this.handleSubscribe();
    }//
    handleSubscribe() {
        subscribe(this.messageContext, serviceChannel, 
            (parameter) =>{
              this.name = parameter.dataload;
            }
            )
    }

}