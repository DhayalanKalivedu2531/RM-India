import { LightningElement } from 'lwc';
import SheetJS from '@salesforce/resourceUrl/SheetJs';
import { loadScript } from 'lightning/platformResourceLoader';
import generateExcelDataFromApex from '@salesforce/apex/ResourceCurrentlyWorkingOn.getResourceDetails';
import AvailableResourcesToExcel from '@salesforce/label/c.AvailableResourcesToExcel';
export default class AvailableReportToExcel extends LightningElement {
    async connectedCallback() {
        await loadScript(this, SheetJS);
        this.version = XLSX.version;
        console.log('version: ' + this.version);
    }

    async exportToExcel() {
        try {
            const filename = AvailableResourcesToExcel+'.xlsx';
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.json_to_sheet([]);

            // Fetching data from Apex
            const result = await generateExcelDataFromApex();
            const records = result.availableResource;
            

            // Group data by Team Name
            const groupedData = {};
            records.forEach(record => { 
                if (!groupedData[record.Practice__r.Name]) {
                    groupedData[record.Practice__r.Name] = [];
                }
                groupedData[record.Practice__r.Name].push(record);
            });
 
            const headerStyle = {
                fill: { fgColor: { rgb: 'FFFF00' } }, 
                font: { bold: true }
            };

            XLSX.utils.sheet_add_json(worksheet, [{ 'Team Name': 'Team Name','Resource Name':'Resource Name', 'Experience': 'Experience', 'Status':'Status', 'Designation': 'Designation' }], { skipHeader: true, origin: 'A1' });
            XLSX.utils.format_cell(worksheet['A1'], headerStyle);

            let rowIndex = 1; 
            for (const teamName in groupedData) {  
                const teamRecords = groupedData[teamName];
                XLSX.utils.sheet_add_json(worksheet, [{ 'Team Name': teamName, 'Name': '', 'Experience': '' }], { skipHeader: true, origin: { r: rowIndex, c: 0 } },headerStyle);
                rowIndex++;

                teamRecords.forEach(record => {
                    XLSX.utils.sheet_add_json(worksheet, [{ 'Team Name': '', 'Name': record.Name, 'Experience': record.Experience__c, 'Status': record.Status__c, 'Designation': record.Designation__c }], { skipHeader: true, origin: { r: rowIndex, c: 0 } },headerStyle);
                    rowIndex++;
                }); 

                // Subtotal row for the team
                XLSX.utils.sheet_add_json(worksheet, [{ 'Team Name': 'Subtotal','Count': teamRecords.length }], { skipHeader: true, origin: { r: rowIndex, c: 0 } },headerStyle);
                rowIndex++;
            }

            XLSX.utils.book_append_sheet(workbook, worksheet, 'ExportToExcel');

            const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });

            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = filename;
            a.click();

            URL.revokeObjectURL(a.href);
        } catch (error) { 
            console.log('Error',JSON.stringify(error));
        }
    }
}