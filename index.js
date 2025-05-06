const baseUrl = 'https://plantejuicingrest20250506131910.azurewebsites.net/api/Jordfugtighed'; // Replace with your actual base URL


 Vue.createApp({
    data() {
        return{
            moisture: [],
            moistureValue: 123
            
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
                this.moistureValue = highestIdObject.jordfugtighedValue; // Antag at jordfugtighedsværdien er i feltet 'moistureValue'
              }
           
            
        
    }
},
mounted() {
    this.getMoisture();
}
}).mount('#app');
