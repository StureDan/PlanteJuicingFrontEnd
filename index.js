const baseUrl = 'https://plantejuicingrest20250506131910.azurewebsites.net/api/'; // Base URL

Vue.createApp({
    data() {
        return {
            moisture: [],
            soilMoistureValue: null,
            moistureMessage: "",
            temperature: [],
            temperatureValue: null,
            tempMessage: "", 
            waterLevel: 75 // Mock water level value
        };
    },
    methods: {
        async getMoisture() {
            const response = await axios.get(baseUrl + "SoilMoisture");
            this.moisture = response.data;
            console.log(this.moisture);
            if (this.moisture.length > 0) {
                const highestIdObject = this.moisture.reduce((max, item) =>
                    item.id > max.id ? item : max
                );
                this.soilMoistureValue = highestIdObject.soilMoistureValue;
            }

            if (this.soilMoistureValue < 30) {
                this.moistureMessage = "Du skal vande din plante! 🌱";
            } else {
                this.moistureMessage = "Din plante har det fint! 😊";
            }
        },
        async getTemperature() {
            try {
                const response = await axios.get(baseUrl + "Temp"); // Hent temperaturdata
                this.temperature = response.data;
                console.log("Temperatur API-svar:", this.temperature); // Log API-svaret

                if (this.temperature.length > 0) {
                    const highestIdObject = this.temperature.reduce((max, item) =>
                        item.id > max.id ? item : max
                    );
                    this.temperatureValue = highestIdObject.tempValue; // Brug det korrekte feltnavn 'tempValue'
                } else {
                    console.warn("Ingen temperaturdata fundet.");
                }

                // Sæt temperaturbeskeden baseret på værdien
                if (this.temperatureValue < 5) {
                    this.tempMessage = "Temperaturen er for lav! ❄️";
                } else if (this.temperatureValue > 40) {
                    this.tempMessage = "Temperaturen er for høj! 🔥";
                } else {
                    this.tempMessage = "Temperaturen er perfekt! 🌡️";
                }
            } catch (error) {
                console.error("Fejl ved hentning af temperaturdata:", error);
            }
        }
    },
    mounted() {
        this.getMoisture();
        this.getTemperature(); // Hent temperaturdata ved opstart
    }
}).mount('#app');
