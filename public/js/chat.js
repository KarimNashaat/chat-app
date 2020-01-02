const socket = io()
const $messageForm = document.querySelector("#message-form")
const $sendButton = $messageForm.sendButton
const $messageInput = $messageForm.message
const $sendLocationButton = document.querySelector("#send-location")
const $messageContainer = document.querySelector("#messages")
const $sideBar = document.querySelector("#side-bar")

//Templates
const $messageTemplate = document.querySelector("#message-template").innerHTML
const $locationTemplate = document.querySelector("#location-template").innerHTML
const $sideBarTemplate = document.querySelector("#side-bar-template").innerHTML

// I took this method from Andrew
const autoscroll = () => {
    // New message element
    const $newMessage = $messageContainer.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $messageContainer.offsetHeight

    // Height of messages container
    const containerHeight = $messageContainer.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $messageContainer.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messageContainer.scrollTop = $messageContainer.scrollHeight
    }
}


socket.on("message", (message) => {
    const html = Mustache.render($messageTemplate, {
        message: message.text,
        createdAt: moment(message.createdAt).format("h:m A"),
        username: message.username
    })
    $messageContainer.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

socket.on("locationMessage", (message) => {
    const html = Mustache.render($locationTemplate, {
        url: message.text,
        createdAt: moment(message.createdAt).format("h:m A"),
        username: message.username
    })
    $messageContainer.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

$messageForm.addEventListener("submit", (event) => {
    event.preventDefault()
    
    $sendButton.setAttribute("disabled", "disabled")

    const message = event.target.message.value
    socket.emit("sendMessage", message, (error) => {
        $sendButton.removeAttribute("disabled")
        $messageInput.focus() // Return Cursor to the input
        $messageInput.value = ''

        if(error){
            console.log(error)
        }
        else{
            console.log("Deliverd.")
        }
    } )
})

$sendLocationButton.addEventListener('click', () => {
    if(!navigator.geolocation){
        return console.log("The browser does not support Geo Location!")
    }

    $sendLocationButton.setAttribute("disabled", "disabled")

    navigator.geolocation.getCurrentPosition((position) => {

        const latitude = position.coords.latitude
        const longitude = position.coords.longitude

        socket.emit("sendLocation", {latitude, longitude}, () => {
            $sendLocationButton.removeAttribute("disabled")
        })
    })
})

const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true} )

socket.emit('join', {username, room}, (error) => {
    if(error){
        alert(error)
        location.href= '/'
    }
})

socket.on("onlineList", ({users, room}) => {
    const html = Mustache.render($sideBarTemplate, {
        room,
        users
    })
    $sideBar.innerHTML = html
})