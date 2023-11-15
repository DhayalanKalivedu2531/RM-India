public class AnalysisDataController {
    @AuraEnabled(cacheable = true)
    public static dataReturn getDataAnalysis(String resourceIdValues) {
        dataReturn wrapperContext = new dataReturn();
        List<Contact> matchExistResource = [SELECT Id, Name, Phone, Practice__c, (SELECT Id, Name FROM Projects__r), (SELECT Id, Name, Start_Date__c, End_Date__c, Resource__r.Name, Resource__c, Project__c, Project__r.Name FROM Project_Resources__r) FROM Contact WHERE Id =: resourceIdValues];
        List<Project_Resource__c> listofResourcesData = new List<Project_Resource__c>();
        List<Integer> calculatedMonthValues = new List<Integer>();
        List<String> matchedProjectNames = new List<String>();
        List<String> allProjectName = new List<String>();
        List<Project__c> getTotalProjectData = [SELECT Id, Name FROM Project__c];
        for (Project__c iterateCollectedValues : getTotalProjectData) {
            allProjectName.add(iterateCollectedValues.Name);
        }
        for (Contact iterateValue : matchExistResource) {
            if (iterateValue.Project_Resources__r != null) {
                listofResourcesData = iterateValue.Project_Resources__r;
                for (Project_Resource__c gettingMatchedName : iterateValue.Project_Resources__r) {
                    String projectName = gettingMatchedName.Project__r.Name;
                    matchedProjectNames.add(projectName);
                    Integer totalMonths = 0; 
                    for (Project_Resource__c resource : listofResourcesData) {
                        if (resource.Project__c == gettingMatchedName.Project__c) {
                            Integer startMonth = resource.Start_Date__c.month();
                            Integer endMonth = resource.End_Date__c.month();
                            Integer startYear = resource.Start_Date__c.year();
                            Integer endYear = resource.End_Date__c.year();
                            Integer monthsWorked = (endYear - startYear) * 12 + (endMonth - startMonth + 1);
                            totalMonths += monthsWorked;
                            if (totalMonths >= 12) {
                                totalMonths = 12;
                                break; 
                            }
                        }
                    }
                    calculatedMonthValues.add(totalMonths); 
                } 
            }
        }
        wrapperContext.calculatedMonthValue = calculatedMonthValues;
        wrapperContext.matchedProjectNames = matchedProjectNames;
        wrapperContext.getTotalProjectName = allProjectName;
        return wrapperContext;
    }
    
    public class dataReturn {
        @AuraEnabled
        public List<String> matchedProjectNames { get; set; }
        @AuraEnabled
        public List<Integer> calculatedMonthValue { get; set; }
        @AuraEnabled
        public List<String> getTotalProjectName { get; set; }
    }
}