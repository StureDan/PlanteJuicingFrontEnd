 const baseUrl = 'https://api.example.com/'; // Replace with your actual base URL

 Vue.createApp({
    data() {
        return{
            moisture: null
        };
 },
methods: {
    async getMoisture() {
        
            //const response = await axios.get(baseUrl);
            const mockData = { moisture: 45 }; // Mock data for testing
            this.moisture = mockData.moisture; // Use mock data instead of API response
            //this.moisture = response.data.moisture;
            
        
    }
},
mounted() {
    this.getMoisture();
}
}).mount('#app');
