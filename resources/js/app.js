//client file
import axios from 'axios'
import Noty from 'noty'
import {initAdmin} from './admin'
import moment from 'moment'

let addToCart= document.querySelectorAll('.add-to-cart')
let cartCounter=document.querySelector('#cartCounter');

function updateCart(pizza){
    axios.post('/update-cart',pizza).then(res=>{
        // console.log(res);
        cartCounter.innerText= res.data.totalQty;
        new Noty({
            type: 'success',
            timeout: 1000,
            text: 'Item added to cart',
            progressBar: false,
            // layout: 'bottomLeft'
        }).show();
    }).catch(err=>{
        new Noty({
            type: 'error',
            timeout: 1000,
            text: 'Oops..Something went wrong!',
            progressBar: false,
            // layout: 'bottomLeft'
        }).show();
    })
}

addToCart.forEach((btn)=>{
    btn.addEventListener('click',(e)=>{
        let pizza=JSON.parse(btn.dataset.pizza)//to get data attribute
        updateCart(pizza);
        // console.log(pizza);
    })
})

// remove alert message after x seconds
const alertMsg = document.querySelector('#success-alert')
if(alertMsg){
    setTimeout(()=>{
        alertMsg.remove()
    },2000)
}

// change order status
let statuses = document.querySelectorAll('.status_line')
// console.log(statuses)
let hiddenInput = document.querySelector('#hiddenInput')
let order = hiddenInput ? hiddenInput.value:null
order=JSON.parse(order)
let time = document.createElement('small')
// console.log(order)

function updateStatus(order){
    statuses.forEach((status)=>{
        status.classList.remove('step-completed')
        status.classList.remove('current')
    })
    let stepCompleted= true
    statuses.forEach((status)=>{
        let dataProp = status.dataset.status
        if(stepCompleted){
            status.classList.add('step-completed')
        }
        if(dataProp === order.status){
            stepCompleted = false
            time.innerText = moment(order.updatedAt).format('hh:mm A')
            status.appendChild(time)
            if(status.nextElementSibling){
                status.nextElementSibling.classList.add('current')
            }
        }
    })
}

updateStatus(order);

// socket
let socket=io()

// join
if(order){
    socket.emit('join',`order_${order._id}`) //creating a room
}
let adminAreaPath = window.location.pathname
// console.log(adminAreaPath)

if(adminAreaPath.includes('admin')){
    initAdmin(socket)
    socket.emit('join', 'adminRoom')
}

socket.on('orderUpdated',(data)=>{
    const updatedOrder= { ...order }      // ... used for copying an object
    updatedOrder.updatedAt = moment().format()
    updatedOrder.status = data.status
    updateStatus(updatedOrder)
    // console.log(data)
    new Noty({
        type: 'success',
        timeout: 1000,
        text: 'Order status updated',
        progressBar: false,
        // layout: 'bottomLeft'
    }).show();
})