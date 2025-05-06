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
        
<<<<<<< HEAD
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
           
=======
            //const response = await axios.get(baseUrl);
            const mockData = { moisture: 45 }; // Mock data for testing
            this.moisture = mockData.moisture; // Use mock data instead of API response
            //this.moisture = response.data.moisture;
>>>>>>> 62fef5bef03a3692067ea86c9b912e4d3c5ef249
            
        
    }
},
mounted() {
    this.getMoisture();
}
}).mount('#app');
