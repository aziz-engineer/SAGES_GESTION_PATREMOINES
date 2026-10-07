// Route::post('/product/{product}', [ProductController::class, 'addToCart']);
// Route::get('/cart', [ProductController::class, 'cart']);
import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom';
import axiosClient from './axios';
import axios from 'axios';

export default function Cart() {
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    // useEffect(() => {
    //   axios.get('http://192.168.152.118:8000/api/cart')
    //     .then(response => setCart(response.data))
    //     .catch(error => console.error(error));
    // }, []);




console.log(  useLocation().state,"cart"
);
  return (
    <div className="container mt-8 py-4">
    {loading && <div className=" mt-8 text-center">Loading...</div>}

    {cart.length >0  && (
        <h1 className="mt-8 py-4  text-success text-center">list Cart.</h1>
      )}

    <div className="row">
      {cart.length === 0 && !loading && (
        <div className="col text-center">No cart available.</div>
      )}


      {cart.map((produit) => (
        <div key={produit.id} className="col-md-4 py-4 mb-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title"> nom:{produit.id}</h5>
              
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
  )
}
