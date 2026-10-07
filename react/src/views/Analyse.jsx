// // src/App.js
// import React, { useEffect, useState } from 'react';
// import axios from 'axios';
// // import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

// const App = () => {
//     const [data, setData] = useState([]);

//     useEffect(() => {
//         const fetchData = async () => {
//             try {
//                 const response = await axios.get('http://192.168.152.118:8000/api/facebook-data');
//                 setData(response.data);
//             } catch (error) {
//                 console.error('Error fetching data:', error);
//             }
//         };

//         fetchData();
//     }, []);

//     return (
//         <div className="App">
//             <h1>Facebook Insights Data</h1>
//             <LineChart
//                 width={600}
//                 height={300}
//                 data={data}
//                 margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
//             >
//                 <CartesianGrid strokeDasharray="3 3" />
//                 <XAxis dataKey="period" />
//                 <YAxis />
//                 <Tooltip />
//                 <Legend />
//                 <Line type="monotone" dataKey="values[0].value" stroke="#8884d8" />
//             </LineChart>
//         </div>
//     );
// };

// export default App;
import React from 'react'

export default function Analyse() {
  return (
    <div>Analyse


        
      Lorem ipsum dolor sit amet, consectetur adipisicing elit. Eius nesciunt illo cupiditate doloribus necessitatibus itaque eveniet. Facilis saepe repellendus atque illum laborum similique alias qui commodi dolorem aliquam, esse animi!
      Lorem ipsum dolor sit amet, consectetur adipisicing elit. Eius nesciunt illo cupiditate doloribus necessitatibus itaque eveniet. Facilis saepe repellendus atque illum laborum similique alias qui commodi dolorem aliquam, esse animi!
      Lorem ipsum dolor sit amet, consectetur adipisicing elit. Eius nesciunt illo cupiditate doloribus necessitatibus itaque eveniet. Facilis saepe repellendus atque illum laborum similique alias qui commodi dolorem aliquam, esse animi!
      Lorem ipsum dolor sit amet, consectetur adipisicing elit. Eius nesciunt illo cupiditate doloribus necessitatibus itaque eveniet. Facilis saepe repellendus atque illum laborum similique alias qui commodi dolorem aliquam, esse animi!
      Lorem ipsum dolor sit amet, consectetur adipisicing elit. Eius nesciunt illo cupiditate doloribus necessitatibus itaque eveniet. Facilis saepe repellendus atque illum laborum similique alias qui commodi dolorem aliquam, esse animi!
      Lorem ipsum dolor sit amet, consectetur adipisicing elit. Eius nesciunt illo cupiditate doloribus necessitatibus itaque eveniet. Facilis saepe repellendus atque illum laborum similique alias qui commodi dolorem aliquam, esse animi!
      Lorem ipsum dolor sit amet, consectetur adipisicing elit. Eius nesciunt illo cupiditate doloribus necessitatibus itaque eveniet. Facilis saepe repellendus atque illum laborum similique alias qui commodi dolorem aliquam, esse animi!
      Lorem ipsum d
    </div>
  )
}


