import { LightningElement, track, api } from 'lwc';
import { loadScript } from 'lightning/platformResourceLoader';
import { NavigationMixin } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import chartjs from '@salesforce/resourceUrl/Chartjs';
import chartjsDatalabels from '@salesforce/resourceUrl/ChartjsPlugin';
import getResourceStatusByTeam from '@salesforce/apex/AnalysisDataController.getDataAnalysis';

export default class ResourceStatusByTeam extends NavigationMixin(LightningElement) {
    @api recordId;
    @track chartConfiguration;
    chart;
    isChartJsInitialized = false;

    connectedCallback() {
        if (this.isChartJsInitialized) {
            return;
        }

        loadScript(this, chartjs)
            .then(() => loadScript(this, chartjsDatalabels))
            .then(() => {
                this.isChartJsInitialized = true;
                getResourceStatusByTeam({ resourceIdValues: this.recordId })
                    .then(data => {
                        if (data) {
                            this.prepareChartData(data);
                            this.renderChart();
                        }
                    })
                    .catch(error => {
                        console.error(error);
                        this.dispatchEvent(
                            new ShowToastEvent({
                                title: 'Error Fetching Data',
                                message: error.body.message,
                                variant: 'error',
                            })
                        );
                    });
            })
            .catch(error => {
                console.error(error);
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error Loading Chart',
                        message: error.message,
                        variant: 'error',
                    })
                );
            });
    }

    prepareChartData(data) {
        let durationData = data.calculatedMonthValue;
        let matchedProjectNames = data.matchedProjectNames;
        const backgroundColors = matchedProjectNames.map(() => this.getRandomColor());

        const currentYear = new Date().getFullYear();
        console.log('Full Year', JSON.stringify(currentYear));
        const dynamicLabelsXAxis = Array.from({ length: 13 }, (_, index) => {
            if (index === 0) {
                return '0';
            } else {
                const month = new Date(currentYear, index - 1, 1);
                console.log('Month New', JSON.stringify(month));
                return month.toLocaleString('default', { month: 'short' }) + currentYear.toString().substring(2);

            }
        });

        this.chartConfiguration = {
            type: 'horizontalBar',
            data: {
                datasets: [
                    {
                        label: 'Months',
                        backgroundColor: backgroundColors,
                        data: durationData,
                        datalabels: {
                            color: 'white',
                            size: 10,
                        },
                    },
                ],
                labels: matchedProjectNames,
            },
            options: {
                indexAxis: 'y',
                scales: {
                    xAxes: [{
                        stacked: true,
                        ticks: {
                            beginAtZero: true,
                            callback: function (value) {
                                return dynamicLabelsXAxis[value];
                            },
                        },
                    }],
                    yAxes: [{
                        stacked: true
                    }]
                },
                tooltips: {
                    callbacks: {
                        label: function (tooltipItem, data) {
                            let datasetLabel = data.datasets[tooltipItem.datasetIndex].label || '';
                            let value = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];
                            return datasetLabel + ': ' + value;
                        }
                    }
                },
            },
            responsive: true,
        };
    }



    renderChart() {
        window.Chart.platform.disableCSSInjection = true;
        const canvas = document.createElement('canvas');
        const container = this.template.querySelector('.canvas-con-inner');
        container.innerHTML = '';
        container.appendChild(canvas);
        const ctx = canvas.getContext('2d');
        if (this.chart) {
            this.chart.destroy();
        }
        this.chart = new window.Chart(ctx, this.chartConfiguration);
    }

    getRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }
}