const API = {
  register: '/api/register/',
  token: '/api/token/',
  tokenRefresh: '/api/token/refresh/',
  items: '/api/items/',
  cart: '/api/cart/',
};

function token() { return localStorage.getItem('access'); }
function setTokens(access, refresh){
  if(access) localStorage.setItem('access', access);
  if(refresh) localStorage.setItem('refresh', refresh);
}
function clearTokens(){ localStorage.removeItem('access'); localStorage.removeItem('refresh'); }

async function postJSON(url, data, auth=true){
  const opts = {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data)};
  if(auth && token()) opts.headers['Authorization'] = 'Bearer ' + token();
  return await fetch(url, opts);
}

async function fetchJSON(url, opts={}) {
  opts.headers = opts.headers || {};
  if(token()) opts.headers['Authorization'] = 'Bearer ' + token();
  return await fetch(url, opts);
}

document.addEventListener('DOMContentLoaded', () => {
  const btnShowLogin = document.getElementById('btn-show-login');
  const btnShowRegister = document.getElementById('btn-show-register');
  const btnLogout = document.getElementById('btn-logout');
  const authSection = document.getElementById('auth-section');
  const authForm = document.getElementById('auth-form');
  const authTitle = document.getElementById('auth-title');
  const userInfo = document.getElementById('user-info');
  const listing = document.getElementById('listing');
  const search = document.getElementById('search');
  const categoryFilter = document.getElementById('category-filter');
  const priceMin = document.getElementById('price-min');
  const priceMax = document.getElementById('price-max');
  const applyFilters = document.getElementById('apply-filters');
  const btnCart = document.getElementById('btn-cart');
  const cartSection = document.getElementById('cart-section');
  const cartItems = document.getElementById('cart-items');   // ✅ FIXED: now defined
  const cartCountSpan = document.getElementById('cart-count');

  let isRegister = false;

  function showAuth(register=false){
    isRegister = register;
    authSection.classList.remove('hidden');
    authTitle.textContent = register ? 'Register' : 'Login';
    document.getElementById('email').style.display = register ? 'block' : 'none';
  }

  btnShowLogin.onclick = ()=> showAuth(false);
  btnShowRegister.onclick = ()=> showAuth(true);

  btnLogout.onclick = ()=>{
    clearTokens();
    updateAuthUI();
    alert('Logged out');
  };

  authForm.onsubmit = async (e)=>{
    e.preventDefault();
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if(isRegister){
      const res = await postJSON(API.register, {username, email, password}, false);
      if(res.status === 201){ alert('Registered — now log in'); showAuth(false); }
      else { const data = await res.json(); alert(JSON.stringify(data)); }
      return;
    } else {
      const res = await postJSON(API.token, {username, password}, false);
      if(res.status===200){ 
        const data = await res.json(); 
        setTokens(data.access, data.refresh); 
        updateAuthUI(); 
        await loadCartCount(); 
      } else { 
        const d = await res.json(); 
        alert(JSON.stringify(d)); 
      }
    }
  };

  async function updateAuthUI(){
    if(token()){
      btnLogout.style.display='inline-block';
      btnShowLogin.style.display='none';
      btnShowRegister.style.display='none';
      userInfo.textContent='Signed in';
    } else {
      btnLogout.style.display='none';
      btnShowLogin.style.display='inline-block';
      btnShowRegister.style.display='inline-block';
      userInfo.textContent='';
    }
  }

  async function loadItems(){
    let url = API.items + '?';
    const params = [];
    if(search.value) params.push('q='+encodeURIComponent(search.value));
    if(categoryFilter.value) params.push('category='+encodeURIComponent(categoryFilter.value));
    if(priceMin.value) params.push('price_min='+encodeURIComponent(priceMin.value));
    if(priceMax.value) params.push('price_max='+encodeURIComponent(priceMax.value));
    url += params.join('&');
    const res = await fetchJSON(url);
    if(res.ok){ const data = await res.json(); renderItems(data); }
    else console.error('Failed to load items', res.status);
  }

  function renderItems(items){
    listing.innerHTML = '';
    items.forEach(it=>{
      const card = document.createElement('div');
      card.className='card';
      card.innerHTML = `
        <img src="${it.image_url || 'https://via.placeholder.com/300x200.png?text=No+Image'}" />
        <h3>${it.name}</h3>
        <p>${it.category}</p>
        <p>₹${it.price}</p>
        <div class="quantity-control">
          <button class="decrease">-</button>
          <span class="qty">1</span>
          <button class="increase">+</button>
        </div>
        <button class="add-to-cart">Add To Cart</button>
      `;
      const qtySpan = card.querySelector('.qty');
      card.querySelector('.increase').onclick = ()=> qtySpan.textContent = parseInt(qtySpan.textContent)+1;
      card.querySelector('.decrease').onclick = ()=> { if(parseInt(qtySpan.textContent)>1) qtySpan.textContent=parseInt(qtySpan.textContent)-1; };
      card.querySelector('.add-to-cart').onclick = ()=> addToCart(it.id, parseInt(qtySpan.textContent));
      listing.append(card);
    });
  }

  async function addToCart(item_id, quantity=1){
    if(!token()){ alert('Please login'); return; }
    const res = await postJSON(API.cart, {item_id, quantity});
    if(res.status===201){ alert('Added to cart'); await loadCartCount(); }
    else { const d = await res.json(); alert(JSON.stringify(d)); }
  }

  async function loadCart(){
    if(!token()){ alert('Login to view cart'); return; }
    const res = await fetchJSON(API.cart);
    if(res.ok){ const data = await res.json(); renderCart(data); }
    else alert('Failed to load cart');
  }

function renderCart(items){
  cartItems.innerHTML = '';
  let totalPrice=0;

  if(items.length===0) {
    cartItems.textContent='Cart empty';
    return;
  }

  items.forEach(ci=>{
    const wrap=document.createElement('div');
    wrap.style.border='1px solid #ddd';
    wrap.style.padding='10px';
    wrap.style.margin='8px 0';
    wrap.style.display='flex';
    wrap.style.alignItems='center';
    wrap.style.justifyContent='space-between';
    wrap.style.background='#fff';
    wrap.style.borderRadius='6px';

    // Image
    const img=document.createElement('img');
    img.src=ci.item.image_url || 'https://via.placeholder.com/80x80.png?text=No+Image';
    img.style.width='80px';
    img.style.height='80px';
    img.style.objectFit='cover';
    img.style.borderRadius='4px';
    img.style.marginRight='12px';

    // Info section
    const infoDiv=document.createElement('div');
    infoDiv.style.flex='1';
    infoDiv.style.display='flex';
    infoDiv.style.flexDirection='column';

    const name=document.createElement('div');
    name.textContent=ci.item.name;
    name.style.fontWeight='bold';
    name.style.marginBottom='4px';

    const price=document.createElement('div');
    price.textContent=`Price: ₹${ci.item.price}`;

    const qty=document.createElement('div');
    qty.textContent=`Quantity: ${ci.quantity}`;

    const lineTotal=document.createElement('div');
    const lineAmount = ci.item.price * ci.quantity;
    lineTotal.textContent=`Total: ₹${lineAmount}`;
    lineTotal.style.fontWeight='bold';

    infoDiv.append(name, price, qty, lineTotal);

    // Remove button
    const removeBtn=document.createElement('button'); 
    removeBtn.textContent='🗑️';
    removeBtn.style.background='transparent';
    removeBtn.style.border='none';
    removeBtn.style.fontSize='18px';
    removeBtn.style.cursor='pointer';
    removeBtn.style.marginLeft='12px';
    removeBtn.onclick=async ()=>{ await removeFromCart(ci.item.id); };

    wrap.append(img, infoDiv, removeBtn);
    cartItems.append(wrap);

    totalPrice += lineAmount;
  });

  // Grand total
  const totalDiv=document.createElement('div');
  totalDiv.style.marginTop='14px';
  totalDiv.style.fontWeight='bold';
  totalDiv.style.fontSize='16px';
  totalDiv.textContent=`Grand Total: ₹${totalPrice}`;
  cartItems.append(totalDiv);

  cartCountSpan.textContent = items.length;
}

  async function updateCart(item_id, quantity){
    const res = await fetchJSON(API.cart + item_id + "/", {
      method:'PUT',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({quantity})
    });
    if(res.ok){ await loadCart(); await loadCartCount(); } 
    else alert('Failed to update quantity');
  }

  async function removeFromCart(item_id){
    const res = await fetchJSON(API.cart, {
      method:'DELETE',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({item_id})
    });
    if(res.ok){ await loadCart(); await loadCartCount(); } else alert('Failed to remove item');
  }

  async function loadCartCount(){
    if(!token()){ cartCountSpan.textContent='0'; return; }
    const res = await fetchJSON(API.cart);
    if(res.ok){ const data = await res.json(); cartCountSpan.textContent = data.length; }
  }

  applyFilters.onclick=()=> loadItems();
  btnCart.onclick=async ()=>{ 
    cartSection.classList.toggle('hidden'); 
    if(!cartSection.classList.contains('hidden')) await loadCart(); 
  };

  updateAuthUI();
  loadItems();
  loadCartCount();
});
