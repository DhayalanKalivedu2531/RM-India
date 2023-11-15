import { LightningElement } from 'lwc';
import SheetJS from '@salesforce/resourceUrl/SheetJs';
import { loadScript } from 'lightning/platformResourceLoader';
import generateExcelDataFromApex from '@salesforce/apex/ResourceCurrentlyWorkingOn.getResourceDetails';
import BillableResourceToExcel from '@salesforce/label/c.BillableResourceToExcel';
export default class BillableReportToExcel extends LightningElement {
    async connectedCallback() {
        await loadScript(this, SheetJS);
        this.version = XLSX.version;
    }

    async exportToExcel() {
        try {
            const filename = BillableResourceToExcel + '.xlsx';
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.json_to_sheet([]);

            // Fetching data from Apex
            const result = await generateExcelDataFromApex();
            const billableResourceList = result.billableResourceList;

            // Group data by Practice Name
            const groupedData = {};

            billableResourceList.forEach(record => {
                const practiceName = record.Resource__r.Practice__r ? record.Resource__r.Practice__r.Name : 'Unknown Practice';
                const projectName = record.Project__r.Name;

                if (!groupedData[practiceName]) {
                    groupedData[practiceName] = {}; 
                }

                if (!groupedData[practiceName][projectName]) {
                    groupedData[practiceName][projectName] = [];
                }

                groupedData[practiceName][projectName].push(record);
            });

            const headerStyle = {
                fill: { fgColor: { rgb: 'FFFF00' } },
                font: { bold: true }
            };

            XLSX.utils.sheet_add_json(
                worksheet,
                [
                    {
                        'Practice Name': 'Practice Name',
                        'Project Name': 'Project Name',
                        'Resource Name': 'Resource Name',
                        'Experience': 'Experience',
                        'Status': 'Status',
                        'Designation': 'Billable'
                    }
                ],
                { skipHeader: true, origin: 'A1' }
            );
            XLSX.utils.format_cell(worksheet['A1'], headerStyle);

            let rowIndex = 1;
            for (const practiceName in groupedData) {
                for (const projectName in groupedData[practiceName]) {
                    const projectRecords = groupedData[practiceName][projectName];
                    XLSX.utils.sheet_add_json(
                        worksheet,
                        [
                            {
                                'Practice Name': practiceName,
                                'Project Name': projectName,
                                'Name': '',
                                'Experience': ''
                            }
                        ],
                        { skipHeader: true, origin: { r: rowIndex, c: 0 } },
                        headerStyle
                    );
                    rowIndex++;

                    projectRecords.forEach(record => {
                        XLSX.utils.sheet_add_json(
                            worksheet,
                            [
                                {
                                    'Practice Name': '',
                                    'Project Name': '',
                                    'Name': record.Resource__r.Name,
                                    'Experience': record.Resource__r.Experience__c,
                                    'Status': record.Resource__r.Status__c,
                                    'Designation': record.Billable__c
                                }
                            ],
                            { skipHeader: true, origin: { r: rowIndex, c: 0 } },
                            headerStyle
                        );
                        rowIndex++;
                    });

                    // Subtotal row for the project within the practice
                    XLSX.utils.sheet_add_json(
                        worksheet,
                        [
                            {
                                'Practice Name': practiceName,
                                'Project Name': 'Subtotal',
                                'Count': projectRecords.length
                            }
                        ],
                        { skipHeader: true, origin: { r: rowIndex, c: 0 } },
                        headerStyle
                    );
                    rowIndex++;
                }
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
            console.log('Error', JSON.stringify(error));
        }
    }
}