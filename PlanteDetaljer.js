// Konstanter for API URL'er
const perenualBaseUrl = 'https://perenual.com/api/species-list?key=sk-2UXs68247b7c5997c10327';
const detailsUrl = 'https://perenual.com/api/species/details/';
const apiKey = 'sk-2UXs68247b7c5997c10327';
const careGuideUrl = 'https://perenual.com/api/species-care-guide-list?key=sk-2UXs68247b7c5997c10327';

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
            localStorage.setItem('plantDetailCache', JSON.stringify(this.store));
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
            const stored = localStorage.getItem('plantDetailCache');
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
            plantId: null,
            plant: null,
            careDetails: null,
            loading: true,
            error: null,
            imageError: false // For at håndtere billeder der ikke kan indlæses
        };
    },
    methods: {
        // Hent parameter fra URL
        getUrlParameter(name) {
            const urlParams = new URLSearchParams(window.location.search);
            return urlParams.get(name);
        },        // Hent plantedetaljer fra API
        async fetchPlantDetails() {
            this.loading = true;
            this.error = null;
            
            try {
                // Tjek først om vi har plantedetaljer i cachen
                const cacheKey = `plant_details_${this.plantId}`;
                const cachedPlant = apiCache.get(cacheKey);
                
                if (cachedPlant) {
                    console.log('Bruger cached plantedetaljer');
                    this.plant = cachedPlant;
                    
                    // Også tjek om vi har plejedetaljer i cachen
                    const careCacheKey = `plant_care_${this.plantId}`;
                    const cachedCare = apiCache.get(careCacheKey);
                    
                    if (cachedCare) {
                        console.log('Bruger cached plejeanvisninger');
                        this.careDetails = cachedCare;
                    } else {
                        // Hvis vi har plantens hoveddata men mangler plejeanvisninger, 
                        // hent kun plejeanvisningerne
                        await this.fetchCareDetails();
                    }
                    
                    return; // Afslut funktionen hvis vi bruger cached data
                }
                
                // Implementer retry-logik for plantedetaljer
                const fetchWithRetry = async (url, retryCount = 0, delay = 1000) => {
                    try {
                        console.log(`Henter data fra ${url} (forsøg ${retryCount + 1})`);
                        const response = await axios.get(url);
                        return response.data;
                    } catch (error) {
                        if (error.response && error.response.status === 429) {
                            const retryAfter = error.response.headers['retry-after'] 
                                ? parseInt(error.response.headers['retry-after']) * 1000 
                                : delay * 2;
                            
                            if (retryCount < 3) {
                                console.log(`Rate limit ramt. Venter ${retryAfter/1000} sekunder før næste forsøg...`);
                                await new Promise(resolve => setTimeout(resolve, retryAfter));
                                return fetchWithRetry(url, retryCount + 1, retryAfter);
                            }
                        }
                        throw error;
                    }
                };
                
                // Vis fuld URL for at hjælpe med fejlfinding
                const fullUrl = `${detailsUrl}${this.plantId}?key=${apiKey}`;
                console.log('Henter plante fra URL:', fullUrl);
                
                // Hent grundlæggende plantedetaljer med retry
                const plantData = await fetchWithRetry(fullUrl);
                
                // Tjek om svaret indeholder data eller fejl
                if (plantData && !plantData.error) {
                    this.plant = plantData;
                    console.log('Plant details:', this.plant);
                    
                    // Gem i cache
                    apiCache.set(cacheKey, plantData);
                    
                    // Log alle tilgængelige billedformater for at finde det bedste billede
                    if (this.plant.default_image) {
                        console.log('Available image types:', Object.keys(this.plant.default_image));
                        console.log('All image data:', this.plant.default_image);
                    }
                    
                    // Hent plejeanvisninger
                    await this.fetchCareDetails();
                    
                } else {
                    // API returnerede en fejl
                    console.error('API Error:', plantData);
                    this.error = `API fejl: ${plantData.message || 'Ukendt fejl fra API'}`;
                }
            } catch (error) {
                console.error('Error fetching plant details:', error);
                this.error = `Der opstod en fejl ved hentning af plantedetaljer: ${error.message || 'Ukendt fejl'}`;
                
                // Prøv at vise cacheddata selv om vi fik en fejl
                const cacheKey = `plant_details_${this.plantId}`;
                const cachedPlant = apiCache.get(cacheKey);
                
                if (cachedPlant) {
                    console.log('Viser cached data efter fejl');
                    this.plant = cachedPlant;
                    this.error = "Kunne ikke hente friske data, viser gemte data i stedet. Nogle oplysninger kan være forældede.";
                }
                
            } finally {
                this.loading = false;
            }
        },
        
        // Separat metode til at hente plejeanvisninger
        async fetchCareDetails() {
            const careCacheKey = `plant_care_${this.plantId}`;
            const cachedCare = apiCache.get(careCacheKey);
            
            if (cachedCare) {
                console.log('Bruger cached plejeanvisninger');
                this.careDetails = cachedCare;
                return;
            }
            
            try {
                const careUrl = `${careGuideUrl}&species_id=${this.plantId}`;
                console.log('Henter plejeanvisninger fra URL:', careUrl);
                
                // Implementer retry-logik
                const fetchWithRetry = async (url, retryCount = 0, delay = 1000) => {
                    try {
                        console.log(`Henter plejeanvisninger (forsøg ${retryCount + 1})`);
                        const response = await axios.get(url);
                        return response.data;
                    } catch (error) {
                        if (error.response && error.response.status === 429) {
                            const retryAfter = error.response.headers['retry-after'] 
                                ? parseInt(error.response.headers['retry-after']) * 1000 
                                : delay * 2;
                            
                            if (retryCount < 3) {
                                console.log(`Rate limit ramt. Venter ${retryAfter/1000} sekunder før næste forsøg...`);
                                await new Promise(resolve => setTimeout(resolve, retryAfter));
                                return fetchWithRetry(url, retryCount + 1, retryAfter);
                            }
                        }
                        throw error;
                    }
                };
                
                const careData = await fetchWithRetry(careUrl);
                
                if (careData.data && careData.data.length > 0) {
                    this.careDetails = careData.data[0].section.reduce((acc, section) => {
                        acc[section.type.toLowerCase()] = section.description;
                        return acc;
                    }, {});
                    console.log('Care details:', this.careDetails);
                    
                    // Gem i cache
                    apiCache.set(careCacheKey, this.careDetails);
                } else {
                    console.log('Ingen plejeanvisninger fundet for denne plante');
                }
            } catch (careError) {
                console.error('Error fetching care details:', careError);
                // Vi fortsætter selvom plejedetaljerne ikke kunne hentes
            }
        },
        // Tilføj plante til brugerens gemte planter        // Håndter fejl ved indlæsning af billeder
        handleImageError(event) {
            console.log('Billede kunne ikke indlæses', event);
            this.imageError = true;
        },
        
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
    },    mounted() {
        // Hent plante-ID fra URL
        this.plantId = this.getUrlParameter('id');
        console.log("Modtog plante-ID fra URL:", this.plantId);
        
        if (this.plantId) {
            // Hvis plantId er et gyldigt ID (et tal), fortsæt med at hente detaljer
            if (!isNaN(parseInt(this.plantId))) {
                console.log("Henter detaljer for plante-ID:", this.plantId);
                this.fetchPlantDetails();
            } else {
                this.loading = false;
                this.error = "Det angivne plante-ID er ikke et gyldigt ID.";
                console.error("Ugyldigt plante-ID:", this.plantId);
            }
        } else {
            this.loading = false;
            this.error = "Intet plante-ID angivet i URL'en.";
            console.error("Intet plante-ID fundet i URL");
        }
    }
}).mount('#app');
