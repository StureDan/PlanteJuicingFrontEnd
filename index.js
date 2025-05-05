 const baseUrl = 'https://api.example.com/'; // Replace with your actual base URL

 Vue.createApp({
    data() {
        return{
            moisture: null
        };
 },
methods: {
    async getMoisture() {
        
            const response = await axios.get(baseUrl);
            this.moisture = response.data.moisture;
            
        
    }
},
mounted() {
    this.getMoisture();
}
}).mount('#app');
