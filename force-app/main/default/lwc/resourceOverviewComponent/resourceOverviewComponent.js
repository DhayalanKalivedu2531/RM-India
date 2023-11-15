import { LightningElement, track } from 'lwc';
import chartjs from '@salesforce/resourceUrl/Chartjs';
import { loadScript } from 'lightning/platformResourceLoader';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getResourceDetails from '@salesforce/apex/ResourceCurrentlyWorkingOn.getResourceDetails';
import doughnutLabelPlugin from '@salesforce/resourceUrl/ChartJsdoughnutlabel';
import ChartjsPlugin from '@salesforce/resourceUrl/ChartjsPlugin';
import { NavigationMixin } from 'lightning/navigation';
export default class efficiencyOverview extends NavigationMixin(LightningElement) {
    @track chartConfig;
    isChartJsInitialized = false;
    totalRecords = 0;

    prepareDounutChartData(data){
        if (data) {
            console.log('Data', data);
            let allocatedResourceCount = Object.keys(data.allocatedResource).length;
            let availableResourceCount = data.availableResource.length;
            let total = allocatedResourceCount + availableResourceCount;
            let allocatedPercentage = (allocatedResourceCount / total) * 100;
            let availablePercentage = (availableResourceCount / total) * 100;
            allocatedPercentage = Math.floor(allocatedPercentage);
            availablePercentage = Math.floor(availablePercentage);
            this.totalRecords = allocatedResourceCount + availableResourceCount;
            let remainingPercentage = 100 - allocatedPercentage - availablePercentage;
            if (remainingPercentage > 0 && remainingPercentage < 100) {
                availablePercentage += remainingPercentage;
            }
 

            console.log('aa', allocatedPercentage);
            console.log('Total Render1',this.totalRecords);
            this.chartConfig = {
                type: 'doughnut',
                data: {
                    datasets: [
                        {
                            data: [allocatedPercentage, availablePercentage],
                            //start
                            datalabels: {
                                clamp: true,                               
                                formatter: (value) => {
                                    return value + '%';
                                },
                            },
                        //end

                            backgroundColor: ['#3e95cd', '#3cba9f'],
                        }
                    ],
                    labels: [
                        `Allocated (${allocatedResourceCount})`,
                        `Available (${availableResourceCount})`
                    ],
                },

                 options: {
                    legend: false,
                    responsive: true,
                    maintainAspectRatio: true,
                      tooltips: {
                        enabled: true,
                        mode: 'single',
                        callbacks: {
                            label: (tooltipItem, data) => {
                                const dataset = data.datasets[tooltipItem.datasetIndex];
                                const value = dataset.data[tooltipItem.index];
                                return `${data.labels[tooltipItem.index]}: ${value}%`;
                            },
                        },
                    },
                    plugins: {  
                        doughnutlabel: {
                            labels: [
                                {
                                    text: this.totalRecords,
                                    font: {
                                        size: 20,
                                        weight: 'bold',
                                    }
                                }
                            ]
                        }
                        // datalabels: {
                        //     formatter: (value) => {
                        //         //console.log('value is '+value);
                        //         return value + '%';
                        //     },
                        //     font: {
                        //         size: 15
                                
                                
                        //     }
                        // }
                    },
                    legend: {
                        display: true, 
                        position: "bottom",
                        align: "center",
                        fontFamily: "Allianz-Neo",
                        textDirection: 'ltr',
                        labels: {
                            usePointStyle: true,
                            fontColor: "black",
                        }
                    },
                     onClick: this.handleClickDataSetEvent.bind(this),  // sadiq
                }

            };

           
            
            this.error = undefined;
        } else if (result.error) {
            this.error = result.error;
            this.chartConfig = undefined;
            this.totalRecords = 0;
        }
    }
    

   
    connectedCallback() {
        
        loadScript(this, chartjs).then(() => loadScript(this, ChartjsPlugin)).then(() => {loadScript(this, doughnutLabelPlugin)}).then(() => {
                this.isChartJsInitialized = true;
                getResourceDetails()
                .then(data => {
                    if (data) {
                        console.log(JSON.stringify(data));
                        this.prepareDounutChartData(data);
                        this.renderChart();
                        
                    }
                })
                
               
            })
            .catch(error => {
                console.log('error'+error);
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error Loading Chart',
                        variant: 'error',
                    })
                ); 
            });
             
    }
        renderChart() {
            window.Chart.platform.disableCSSInjection = false;
            const canvas = document.createElement('canvas');
            // canvas.width = 180;  
             canvas.height = 275;
            const container = this.template.querySelector('.canvas-con-inner');
            container.innerHTML = '';
            container.appendChild(canvas);
            const ctx = canvas.getContext('2d');
            this.chart = new window.Chart(ctx, this.chartConfig);
            console.log('Total Render2',this.totalRecords);
        }
        handleClickDataSetEvent(event) {
        const activeElement = this.chart.getElementAtEvent(event)[0]; 
        if (activeElement) {
            this.handleNavigation();
        }
    }

    handleNavigation() {
        var defination = {
            componentDef: 'c:ResourceAllocationView',
        }
        this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
            attributes: {
                url: '/one/one.app#' + btoa(JSON.stringify(defination))
            }
        })
    }

    }