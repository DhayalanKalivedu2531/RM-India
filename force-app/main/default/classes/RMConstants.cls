/*
*Created By		: Kondam Deepaksai
*Created Date 	: July 11, 2023.
*Description	: To store the constants used in Resource Management Application
*/
public with sharing class RMConstants {
	//Profile Constants
	public static final String PROFILE_MANAGER = 'Profile Manager'; //As part of RMG-001 by Deepaksai
    public static Profile profile = [SELECT Name FROM Profile WHERE id=:UserInfo.getProfileId()];
    public static String currentUserProfile = profile.Name;   //  USED IN RMG-29 by Sadiq
    
     public static String accountType = 'Partner';   //  USED IN RESOURCE ALLOCATION VIEW CONTROLLER BY SADIQ
    
     public static String projectStatus = 'Live';
    
    public static String liveStatus = 'Live'; // USED IN ADD RESOURCE MULTIPLE CONTROLLER BY DHAYALAN 
    
    public static String activeStatus = 'Active'; // USED IN ADD RESOURCE MULTIPLE CONTROLLER BY DHAYALAN
    
    public static String pendingStatus = 'pending'; // USED IN ADD RESOURCE MULTIPLE CONTROLLER BY DHAYALAN
    
    
   
}