const perenualBaseUrl = 'https://perenual.com/api/species-list?key=sk-2UXs68247b7c5997c10327';
const detailsUrl = 'https://perenual.com/api/species-care-guide-list?key=sk-2UXs68247b7c5997c10327';

// Cache system til at undgå for mange API-kald
const apiCache = {
    // Cache data med timestamp
    store: {},
    
    // Gem data i cachen
    set: function(key, data) {
        this.store[key] = {
            timestamp: Date.now(),
            data: data
        };
        // Gem også cachen i localStorage for at bevare den mellem besøg
        try {
            localStorage.setItem('plantCache', JSON.stringify(this.store));
        } catch (e) {
            console.warn('Kunne ikke gemme cache i localStorage', e);
        }
    },
    
    // Hent data fra cachen hvis det findes og ikke er for gammelt (24 timer)
    get: function(key) {
        const cached = this.store[key];
        if (cached && (Date.now() - cached.timestamp < 24 * 60 * 60 * 1000)) {
            console.log('Bruger cached data for', key);
            return cached.data;
        }
        return null;
    },
    
    // Indlæs cache fra localStorage ved opstart
    loadFromStorage: function() {
        try {
            const stored = localStorage.getItem('plantCache');
            if (stored) {
                this.store = JSON.parse(stored);
                console.log('Cache indlæst fra localStorage');
            }
        } catch (e) {
            console.warn('Kunne ikke indlæse cache fra localStorage', e);
        }
    }
};

// Indlæs cache ved opstart
apiCache.loadFromStorage();

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
            loading: false, // Loading state
            retryCount: 0, // Tæl antal retry forsøg
            imageErrors: {} // Håndter billeder der ikke kan indlæses
        };
    },
    methods: {
        addPlant(plant) {
            // Kontroller om plant.id eksisterer og er et gyldigt nummer
            if (!plant.id || isNaN(parseInt(plant.id))) {
                console.error("Planten har ikke et gyldigt ID:", plant);
                alert("Kan ikke gemme planten, da den mangler et gyldigt ID.");
                return;
            }

            console.log("Tilføjer plante med ID:", plant.id);

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
        },        async fetchPlants() {
            this.loading = true;
            this.retryCount = 0;
            
            try {
                // Byg URL afhængigt af om der er en aktiv søgning
                let url = `${perenualBaseUrl}&page=${this.currentPage}`;

                // Hvis der er en aktiv søgning, tilføj søgestrengen som q parameter
                if (this.isSearchActive && this.searchQuery.trim()) {
                    url += `&q=${encodeURIComponent(this.searchQuery.trim())}`;
                }
                
                // Generer en cache-nøgle baseret på URL'en
                const cacheKey = url;
                
                // Tjek først om vi har data i cachen
                const cachedData = apiCache.get(cacheKey);
                if (cachedData) {
                    console.log('Bruger cached data i stedet for API-kald');
                    // Opdater resultater og total antal sider fra cache
                    this.results = cachedData.data;
                    
                    if (cachedData.meta && cachedData.meta.total_pages) {
                        this.totalPages = cachedData.meta.total_pages;
                    } else if (this.isSearchActive) {
                        this.totalPages = this.results.length > 0 ? 1 : 0;
                    }
                    
                    return; // Afslut funktionen her hvis vi bruger cached data
                }

                // Implementer retry-logik med asynkron funktion
                const fetchWithRetry = async (retryCount = 0, delay = 1000) => {
                    try {
                        console.log(`Fetching plants from URL (forsøg ${retryCount + 1}):`, url);
                        const response = await axios.get(url);
                        console.log('API svarede med data:', response.data);
                        
                        // Gem i cache
                        apiCache.set(cacheKey, response.data);
                        
                        return response.data;
                    } catch (error) {
                        // Tjek om det er en rate-limit fejl (HTTP 429)
                        if (error.response && error.response.status === 429) {
                            // Få ventetid fra header hvis tilgængelig, ellers brug progressiv backoff
                            const retryAfter = error.response.headers['retry-after'] 
                                ? parseInt(error.response.headers['retry-after']) * 1000 
                                : delay * 2; // Double delay for hver retry
                            
                            if (retryCount < 3) { // Maksimalt 3 forsøg
                                console.log(`Rate limit ramt. Venter ${retryAfter/1000} sekunder før næste forsøg...`);
                                await new Promise(resolve => setTimeout(resolve, retryAfter));
                                return fetchWithRetry(retryCount + 1, retryAfter);
                            }
                        }
                        throw error; // Kast fejlen videre hvis det ikke er en rate-limit fejl eller vi har brugt alle forsøg
                    }
                };
                
                // Start fetch med retry
                const responseData = await fetchWithRetry();

                // Opdater resultater og total antal sider
                this.results = responseData.data;

                // Hvis der kom resultater tilbage og der er metadata om antal sider
                if (responseData.meta && responseData.meta.total_pages) {
                    this.totalPages = responseData.meta.total_pages;
                } else if (this.isSearchActive) {
                    // Hvis der er en søgning men ingen metadata, sæt totalPages baseret på om der er resultater
                    this.totalPages = this.results.length > 0 ? 1 : 0;
                }

            } catch (error) {
                console.error('Error fetching plants:', error);
                // Ved fejl, vis en brugervenlig fejlmeddelelse
                alert('Der opstod en fejl ved hentning af planter. Vi har implementeret caching, så du kan stadig se tidligere indlæste resultater.');
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
        },        async fetchPlantDetails(plantId) {
            try {
                const url = `${detailsUrl}&species_id=${plantId}`;
                const cacheKey = `details_${plantId}`;
                
                // Tjek først om vi har data i cachen
                const cachedData = apiCache.get(cacheKey);
                if (cachedData) {
                    console.log('Bruger cached plantedetaljer');
                    this.selectedPlant = cachedData.data;
                    return;
                }
                
                // Implementer retry-logik
                const fetchWithRetry = async (retryCount = 0, delay = 1000) => {
                    try {
                        console.log(`Henter plantedetaljer (forsøg ${retryCount + 1}):`, url);
                        const response = await axios.get(url);
                        
                        // Gem resultatet i cache
                        apiCache.set(cacheKey, response.data);
                        
                        return response.data;
                    } catch (error) {
                        if (error.response && error.response.status === 429) {
                            const retryAfter = error.response.headers['retry-after'] 
                                ? parseInt(error.response.headers['retry-after']) * 1000 
                                : delay * 2;
                            
                            if (retryCount < 3) {
                                console.log(`Rate limit ramt. Venter ${retryAfter/1000} sekunder før næste forsøg...`);
                                await new Promise(resolve => setTimeout(resolve, retryAfter));
                                return fetchWithRetry(retryCount + 1, retryAfter);
                            }
                        }
                        throw error;
                    }
                };
                
                const responseData = await fetchWithRetry();
                console.log('Plantedetaljer modtaget:', responseData);
                this.selectedPlant = responseData.data; // Gem detaljerne for den valgte plante
            } catch (error) {
                console.error('Error fetching plant details:', error);
                alert('Der opstod en fejl ved hentning af plantedetaljer. Prøv igen senere.');
            }
        },nextPage() {
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