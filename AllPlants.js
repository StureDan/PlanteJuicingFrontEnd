const perenualBaseUrl = 'https://perenual.com/api/species-list?key=sk-2UXs68247b7c5997c10327';
const detailsUrl = 'https://perenual.com/api/species-care-guide-list?key=sk-2UXs68247b7c5997c10327';

Vue.createApp({    
    data() {
        return {
            searchQuery: '',
            selectedPlant: null, // Gem detaljer om den valgte plante
            results: [],
            currentPage: 1,
            totalPages: 337,
            isSearchActive: false, // Flag til at vise om en søgning er aktiv
            originalTotalPages: 337, // Gem det oprindelige antal sider
            loading: false // Loading state
        };
    },
    methods: {
        addPlant(plant) {
            // Opret plante-objekt til at gemme lokalt
            const plantData = {
                id: Date.now(), // Unik ID baseret på tidsstempel
                plantId: plant.id, // Gem det originale plante-ID fra API'en
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
        },  
             
         async fetchPlants() {
            this.loading = true;
            try {
                // Byg URL afhængigt af om der er en aktiv søgning
                let url = `${perenualBaseUrl}&page=${this.currentPage}`;
                
                // Hvis der er en aktiv søgning, tilføj søgestrengen som q parameter
                if (this.isSearchActive && this.searchQuery.trim()) {
                    url += `&q=${encodeURIComponent(this.searchQuery.trim())}`;
                }
                
                console.log('Fetching plants from URL:', url);
                const response = await axios.get(url);
                console.log(response.data);
                
                // Opdater resultater og total antal sider
                this.results = response.data.data;
                
                // Hvis der kom resultater tilbage og der er metadata om antal sider
                if (response.data.meta && response.data.meta.total_pages) {
                    this.totalPages = response.data.meta.total_pages;
                } else if (this.isSearchActive) {
                    // Hvis der er en søgning men ingen metadata, sæt totalPages baseret på om der er resultater
                    this.totalPages = this.results.length > 0 ? 1 : 0;
                }
                
            } catch (error) {
                console.error('Error fetching plants:', error);
                // Ved fejl, vis en brugervenlig fejlmeddelelse
                alert('Der opstod en fejl ved hentning af planter. Prøv igen senere.');
            } finally {
                this.loading = false;
            }
        },
        
        // Ny metode til at starte en søgning
        async searchPlants() {
            if (!this.searchQuery.trim()) {
                alert('Indtast venligst en søgestreng');
                return;
            }
            
            // Sæt søgning som aktiv og nulstil til side 1
            this.isSearchActive = true;
            this.currentPage = 1;
            
            // Hent planter med den nye søgestreng
            await this.fetchPlants();
            
            // Giv feedback hvis der ikke er resultater
            if (this.results.length === 0) {
                alert('Ingen planter fundet der matcher din søgning');
            }
        },
        
        // Ny metode til at rydde søgningen
        async clearSearch() {
            this.searchQuery = '';
            this.isSearchActive = false;
            this.currentPage = 1;
            this.totalPages = this.originalTotalPages;
            await this.fetchPlants();
        },
        async fetchPlantDetails(plantId) {
            try {
                const response = await axios.get(`${detailsUrl}&species_id=${plantId}`);
                console.log(response.data);
                this.selectedPlant = response.data.data; // Gem detaljerne for den valgte plante
            } catch (error) {
                console.error('Error fetching plant details:', error);
            }
        },        nextPage() {
            if (this.currentPage < this.totalPages) {
                this.currentPage++;
                this.fetchPlants();
                // Scroll til toppen af siden
                window.scrollTo(0, 0);
            }
        },
        prevPage() {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.fetchPlants();
                // Scroll til toppen af siden
                window.scrollTo(0, 0);
            }
        }
    },
    mounted() {
        this.fetchPlants();
    }
}).mount('#app');