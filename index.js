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
            waterLevelValue: null,
            waterLevelMessage: "",
            plants: [],
            selectedPlant: null, // Gem detaljer om den valgte plante
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

        },        
        async getWaterLevel() {
            try {
                const response = await axios.get(baseUrl + "WaterLevel"); // Hent vandstand
                console.log("Vandstand API-svar:", response.data); // Log API-svaret

                if (response.data.length > 0) {
                    const highestIdObject = response.data.reduce((max, item) =>
                        item.id > max.id ? item : max
                    );
                    this.waterLevelValue = highestIdObject.waterLevelValue; // Brug det korrekte feltnavn
                } else {
                    console.warn("Ingen vandstanddata fundet.");
                }

                // Tilføj en besked baseret på vandstandsværdien
                if (this.waterLevelValue < 20) {
                    this.waterLevelMessage = "Vandstanden er for lav! 💧";
                } else if (this.waterLevelValue > 100) {
                    this.waterLevelMessage = "Vandstanden er for høj! 🌊";
                } else {
                    this.waterLevelMessage = "Vandstanden er passende. 😊";
                }
            } catch (error) {
                console.error("Fejl ved hentning af vandstanddata:", error);
            }        },        // Hent planter fra localStorage
        getPlants() {
            // Hent gemte planter fra localStorage
            const savedPlants = localStorage.getItem('savedPlants');
            
            if (savedPlants) {
                this.plants = JSON.parse(savedPlants);
                console.log("Planter hentet fra localStorage:", this.plants);
            } else {
                this.plants = [];
                console.log("Ingen gemte planter fundet i localStorage");
            }
        },
        // Slet en plante fra localStorage
        deletePlant(plantId) {
            if (confirm("Er du sikker på, at du vil slette denne plante?")) {                // Hent gemte planter
                let savedPlants = JSON.parse(localStorage.getItem('savedPlants') || '[]');
                
                // Filtrer planten med det angivne ID ud
                savedPlants = savedPlants.filter(plant => plant.id !== plantId);
                
                // Gem den opdaterede liste tilbage i localStorage
                localStorage.setItem('savedPlants', JSON.stringify(savedPlants));
                
                // Opdater plants array i Vue komponenten
                this.plants = savedPlants;
                
                alert("Planten er blevet slettet.");
            }
        },
          // Vis detaljer om en specifik plante
        viewPlantDetails(plantId) {
            // Find planten i det lokale array
            const plant = this.plants.find(p => p.id === plantId);
            console.log("Forsøger at vise detaljer for plante:", plant);
            
            if (plant && plant.plantId) {
                // Naviger til PlanteDetaljer.html med det korrekte API plante-ID
                console.log("Navigerer til plantedetaljer med ID:", plant.plantId);
                window.location.href = `PlanteDetaljer.html?id=${plant.plantId}`;
            } else {
                // Hvis planten ikke har et plantId, vis en fejlmeddelelse med mere information
                console.error("Planten mangler plantId:", plant);
                alert("Kan ikke finde detaljer for denne plante. Den valgte plante mangler et reference-ID til API'en.");
            }
        }
    },
    mounted() {
        this.getMoisture();
        this.getTemperature();
        this.getWaterLevel(); // Hent vandstand ved opstart
        this.getPlants(); // Hent planter ved opstart
    }
}).mount('#app');
