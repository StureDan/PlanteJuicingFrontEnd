const perenualBaseUrl = 'https://perenual.com/api/species-list?key=sk-WMlO681db3e3dcd7a10327';
const detailsUrl = 'https://perenual.com/api/species-care-guide-list?key=sk-WMlO681db3e3dcd7a10327';

Vue.createApp({
    data() {
        return {
            searchQuery: '',
            searchResults: [],
            selectedPlant: null, // Gem detaljer om den valgte plante
            results: [],
            currentPage: 1,
            totalPages: 337,
        };
    },    methods: {
        addPlant(plant) {            // Opret plante-objekt til at gemme lokalt
            const plantData = {
                id: Date.now(), // Unik ID baseret på tidsstempel
                name: plant.common_name || 'Ukendt plante',
                image: plant.default_image?.thumbnail || 'https://via.placeholder.com/50x50?text=Plante',
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
        },
        
        async fetchPlants() {
            try {
                const response = await axios.get(`${perenualBaseUrl}&page=${this.currentPage}`);
                console.log(response.data);
                this.results = response.data.data;
            } catch (error) {
                console.error('Error fetching plants:', error);
            }
        },
        async fetchPlantDetails(plantId) {
            try {
                const response = await axios.get(`${detailsUrl}&species_id=${plantId}`);
                console.log(response.data);
                this.selectedPlant = response.data.data; // Gem detaljerne for den valgte plante
            } catch (error) {
                console.error('Error fetching plant details:', error);
            }
        },
        nextPage() {
            if (this.currentPage < this.totalPages) {
                this.currentPage++;
                this.fetchPlants();
            }
        },
        prevPage() {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.fetchPlants();
            }
        }
    },
    mounted() {
        this.fetchPlants();
    }
}).mount('#app');