const baseUrl = 'https://plantejuicingrest20250506131910.azurewebsites.net/api/SoilMoisture'; // Replace with your actual base URL

Vue.createApp({
    data() {
        return {
            moisture: [],
            soilMoistureValue: 123,
            moistureMessage: "",
            temperature: 22, // Mock temperature value
            waterLevel: 75 // Mock water level value
        };
    },
    methods: {
        async getMoisture() {
            const response = await axios.get(baseUrl);
            this.moisture = response.data;
            console.log(this.moisture);
            if (this.moisture.length > 0) {
                // Find objektet med det højeste id og gem kun jordfugtighedsværdien
                const highestIdObject = this.moisture.reduce((max, item) =>
                    item.id > max.id ? item : max
                );
                this.soilMoistureValue = highestIdObject.soilMoistureValue; // Antag at jordfugtighedsværdien er i feltet 'moistureValue'
            }

            // Set the moisture message based on the moisture value
            if (this.soilMoistureValue < 30) {
                this.moistureMessage = "Du skal vande din plante! 🌱";
            } else {
                this.moistureMessage = "Din plante har det fint! 😊";
            }
        }
    },
    mounted() {
        this.getMoisture();
    }
}).mount('#app');
