public class AddResourceMultipleController{
    public static String liveStatus = RMConstants.liveStatus;
    public static String activeStatus = RMConstants.activeStatus;
    public static String pendingStatus = RMConstants.pendingStatus;
    @AuraEnabled
    public static List<AddMultipleResourceWrapper> fetchSavedResources(String projectIdValues, Boolean toggleValue) {
        List<AddMultipleResourceWrapper> ListOfWrapper = New List<AddMultipleResourceWrapper>();
        String statusClause;
        if (toggleValue){
            statusClause = 'Status__c != \'Completed\' AND Status__c != \'Pending\' AND Status__c != null';
        } else{
            statusClause = 'Status__c = \'Completed\' OR Status__c = \'Pending\'';
        }
        String soqlQuery = 'SELECT Id, Name, Status__c, Project_Role__c, Resource__c,Billable__c, Resource__r.Name,Reason_for_Non_Billable__c, Allocation__c, Allocation_Unit__c, Start_Date__c, End_Date__c, Project__c, Project__r.Name ' + 
                         'FROM Project_Resource__c ' + 'WHERE Project__c = :projectIdValues AND (' + statusClause + ')';

        List<Project_Resource__c> resourcesListofProject = Database.query(soqlQuery);
        AddMultipleResourceWrapper resourceDataWrapper = new AddMultipleResourceWrapper();
        resourceDataWrapper.listOfResource = resourcesListofProject;
        ListOfWrapper.add(resourceDataWrapper);
        return ListOfWrapper;
    }

    @AuraEnabled(Cacheable = true)
    Public Static List<Team__c> getTeamValues() {
        List<Team__c> ListOfTeamValues = [SELECT Id, Name FROM Team__c];
        return ListOfTeamValues;
    }

    @AuraEnabled
    public static List<AddMultipleResourceWrapper> fetchTeamsResource(String teamName, String projectId) {

        List<AddMultipleResourceWrapper> fetchResourceDataWrapper = new List<AddMultipleResourceWrapper>();
        AddMultipleResourceWrapper resourceProjectValues = new AddMultipleResourceWrapper();

        if (teamName != null) {
            List<Team__c> teamData = [SELECT Id, Name, (SELECT Id, Name, FirstName, LastName, Experience__c, Practice__c FROM Resources__r WHERE Status__c = :liveStatus) FROM Team__c WHERE Name = :teamName];
            List<Project_Resource__c> activeProjectResources = [SELECT Id, Resource__c, Name, Project__c, Project__r.Name FROM Project_Resource__c WHERE Status__c = :activeStatus OR Status__c=:pendingStatus];
            List<Contact> contactList = new List<Contact>();
            List<Id> contactResource = new List<Id>();
            for (Project_Resource__c projectResource : activeProjectResources) {
                if (projectResource.Project__c == projectId) {
                    contactResource.add(projectResource.Resource__c);
                }
            }
            for (Team__c teamValue : teamData) {
                for (Contact contactValue : teamValue.Resources__r){
                    Contact contactData = new Contact();
                    if (!contactResource.contains(contactValue.Id)){
                        /*contactData.Id = contactValue.Id;
                        contactData.FirstName = contactValue.FirstName;
                        contactData.Experience__c = contactValue.Experience__c;
                        contactData.Practice__c = contactValue.Practice__c;*/
                        
                        contactList.add(contactValue);
                    }
                }
                resourceProjectValues.listOfContacts = contactList;
                fetchResourceDataWrapper.add(resourceProjectValues);
            }
        }
        return fetchResourceDataWrapper;
    }

    @AuraEnabled
    public static void addingResourceToProject(String projectId, List<Decimal> resourceAllocationValues, List<Contact> resourceIds, List<Date> startDates, List<Date> endDates, List<String> projectRoles, List<String> allocationUnits, List<String> statusValues, Date startDateValidate, Date endDateValidate, List<Project_Resource__c> existResourceData) {

        // Insert Operation For Adding New Project Resource.
        List<Project_Resource__c> resourcesToInsert = new List<Project_Resource__c>();
        Set<String> resourceKeySet = new Set<String>();
        Integer index = 0;
        for (Contact resourceId : resourceIds){
            String resourceKey = resourceId.Id + '-' + projectId;
            if (!resourceKeySet.contains(resourceKey)){
                resourceKeySet.add(resourceKey);
                Project_Resource__c newResource = new Project_Resource__c();
                newResource.Resource__c = resourceId.Id;
                newResource.Project__c = projectId;
                newResource.Allocation__c = (resourceAllocationValues != null && index < resourceAllocationValues.size() && resourceAllocationValues[index] != null) ? resourceAllocationValues[index] : 100;
                newResource.Start_Date__c = startDates != null && index < startDates.size() ? startDates[index] : startDateValidate;
                newResource.End_Date__c = endDates != null && index < endDates.size() ? endDates[index] : endDateValidate;
                newResource.Project_Role__c = projectRoles != null && index < projectRoles.size() ? projectRoles[index] : null;
                newResource.Allocation_Unit__c = allocationUnits != null && index < allocationUnits.size() ? allocationUnits[index] : null;
                newResource.Status__c = statusValues != null && index < statusValues.size() ? statusValues[index] : activeStatus;
                resourcesToInsert.add(newResource);
            }
            index++;
        }

        if (!resourcesToInsert.isEmpty()){
            try{
                insert resourcesToInsert; 
            } catch (DMlException ex){
                throw new AuraHandledException(ex.getMessage());
            }
        }

        if (existResourceData != null && !existResourceData.isEmpty()){
            Map<Id, Project_Resource__c> existingResourceMap = new Map<Id, Project_Resource__c>([SELECT Id, Project_Role__c, Status__c, Allocation__c, Start_Date__c FROM Project_Resource__c WHERE Id IN:existResourceData]);
            List<Project_Resource__c> resourcesToUpdate = new List<Project_Resource__c>();
            for (Project_Resource__c updateResourceValues : existResourceData){
                Project_Resource__c existingResource = existingResourceMap.get(updateResourceValues.Id);
                if (existingResource != null){
                    existingResource.Allocation__c = updateResourceValues.Allocation__c;
                    existingResource.Status__c = updateResourceValues.Status__c;
                    existingResource.Start_Date__c = updateResourceValues.Start_Date__c;
                    existingResource.Allocation_Unit__c = updateResourceValues.Allocation_Unit__c;
                    existingResource.End_Date__c = updateResourceValues.End_Date__c;
                    existingResource.Project_Role__c = updateResourceValues.Project_Role__c;
                    resourcesToUpdate.add(existingResource);
                    existingResourceMap.remove(updateResourceValues.Id);
                }
            }

            if (!resourcesToUpdate.isEmpty()){
                try{
                    update resourcesToUpdate;
                    System.debug('testing error'+resourcesToUpdate);
                } catch (Exception ex){
                    throw new AuraHandledException(ex.getMessage());
                }
            }
        }
    }

    @AuraEnabled
    Public static List<AddMultipleResourceWrapper> validateProjectDateRange(String projectIds) {
        List<AddMultipleResourceWrapper> fetchProjectDatewrapper = New List<AddMultipleResourceWrapper>();
        List<Project__c> projectDateValidator = [SELECT Id, Start_Date__c, End_Date__c FROM Project__c WHERE Id = :ProjectIds];
        AddMultipleResourceWrapper dateValidationData = New AddMultipleResourceWrapper();
        for (Project__c dateIterationList : projectDateValidator){
            if (dateIterationList.Start_Date__c >= date.today()){
                dateValidationData.startDateValidation = dateIterationList.Start_Date__c;
                dateValidationData.endDateValidation = dateIterationList.End_Date__c;
            } else if (dateIterationList.Start_Date__c <= date.today()){
                dateValidationData.startDateValidation = date.today();
                dateValidationData.endDateValidation = dateIterationList.End_Date__c;
            }
            fetchProjectDatewrapper.add(dateValidationData);
        }
        return fetchProjectDatewrapper;
    }

    @AuraEnabled
    public Static ResourceDetails fetchTotalAvailableResource(String projectIds) {
        ResourceDetails resourceDetailsWrapper = new ResourceDetails();
        List<Contact> availableResourceData = [SELECT Id, Name,FirstName, LastName, Experience__c, Practice__c, Practice__r.Name,  Status__c FROM Contact WHERE Status__c = :liveStatus];
        List<Project_Resource__c> activeProjectResources = [SELECT Id, Resource__c, Name, Project__c, Project__r.Name FROM Project_Resource__c WHERE Status__c = :activeStatus  OR Status__c=:pendingStatus];
        List<Contact> contactList = new List<Contact>();
        List<Id> contactResource = new List<Id>();

        for (Project_Resource__c projectResource : activeProjectResources){
            if (projectResource.Project__c == projectIds){
                contactResource.add(projectResource.Resource__c);
            }
        }

        for (Contact contactValue : availableResourceData){
            if (!contactResource.contains(contactValue.Id)){
                contactList.add(contactValue);
            }
        }
        resourceDetailsWrapper.fetchAllResourceDetails = contactList;
        return resourceDetailsWrapper;
    }

    Public class AddMultipleResourceWrapper {
        @AuraEnabled
        Public List<Project_Resource__c> listOfResource{ get; set; }
        @AuraEnabled
        Public List<Contact> listOfContacts{ get; set; }
        @AuraEnabled
        Public date startDateValidation{ get; set; }
        @AuraEnabled
        Public date endDateValidation{ get; set; }  
    }
    
    public class ResourceDetails {
        @AuraEnabled
        Public List<Contact> fetchAllResourceDetails{ get; set; }

    }

}