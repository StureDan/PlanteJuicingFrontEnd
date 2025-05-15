// Konstanter for API URL'er
const perenualBaseUrl = 'https://perenual.com/api/species-list?key=sk-2UXs68247b7c5997c10327';
const detailsUrl = 'https://perenual.com/api/species/details/';
const apiKey = 'sk-2UXs68247b7c5997c10327';
const careGuideUrl = 'https://perenual.com/api/species-care-guide-list?key=sk-2UXs68247b7c5997c10327';

Vue.createApp({
    data() {
        return {
            plantId: null,
            plant: null,
            careDetails: null,
            loading: true,
            error: null
        };
    },
    methods: {
        // Hent parameter fra URL
        getUrlParameter(name) {
            const urlParams = new URLSearchParams(window.location.search);
            return urlParams.get(name);
        },
          // Hent plantedetaljer fra API
        async fetchPlantDetails() {
            this.loading = true;
            this.error = null;
            
            try {                
                // Hent grundlæggende plantedetaljer med API nøgle som query parameter
                const response = await axios.get(`${detailsUrl}${this.plantId}?key=${apiKey}`);
                this.plant = response.data;
                console.log('Plant details:', this.plant);
                
                // Log alle tilgængelige billedformater for at finde det bedste billede
                if (this.plant.default_image) {
                    console.log('Available image types:', Object.keys(this.plant.default_image));
                    console.log('All image data:', this.plant.default_image);
                }
                
                // Hent plejeanvisninger
                try {
                    const careResponse = await axios.get(`${careGuideUrl}&species_id=${this.plantId}`);
                    if (careResponse.data.data && careResponse.data.data.length > 0) {
                        this.careDetails = careResponse.data.data[0].section.reduce((acc, section) => {
                            acc[section.type.toLowerCase()] = section.description;
                            return acc;
                        }, {});
                    }
                    console.log('Care details:', this.careDetails);
                } catch (careError) {
                    console.error('Error fetching care details:', careError);
                    // Vi fortsætter selvom plejedetaljerne ikke kunne hentes
                }
                
            } catch (error) {
                console.error('Error fetching plant details:', error);
                this.error = 'Der opstod en fejl ved hentning af plantedetaljer. Prøv igen senere.';
            } finally {
                this.loading = false;
            }        },
        // Tilføj plante til brugerens gemte planter
        addPlant(plant) {
            // Opret plante-objekt til at gemme lokalt
            const plantData = {
                id: Date.now(), // Unik ID baseret på tidsstempel
                name: plant.common_name || 'Ukendt plante',
                image: plant.default_image?.thumbnail || 'https://via.placeholder.com/50x50?text=Plante',
                watering: plant.watering || 'Ukendt',
                sunlight: Array.isArray(plant.sunlight) ? plant.sunlight.join(', ') : (plant.sunlight || 'Ukendt'),
                description: `${plant.scientific_name || ''} - Cyklus: ${plant.cycle || 'Ukendt'}, Vandes: ${plant.watering || 'Ukendt'}`
            };
            
            // Hent eksisterende planter fra localStorage
            let savedPlants = JSON.parse(localStorage.getItem('savedPlants') || '[]');
            
            // Tilføj den nye plante
            savedPlants.push(plantData);
            
            // Gem den opdaterede liste i localStorage
            localStorage.setItem('savedPlants', JSON.stringify(savedPlants));
            
            console.log('Plant added to saved plants:', plantData);
            
            // Vis succes besked
            alert(`Planten "${plantData.name}" er blevet tilføjet til dine planter!`);
        }
    },
    mounted() {
        // Hent plante-ID fra URL
        this.plantId = this.getUrlParameter('id');
        
        if (this.plantId) {
            this.fetchPlantDetails();
        } else {
            this.loading = false;
            this.error = "Intet plante-ID angivet i URL'en.";
        }
    }
}).mount('#app');
