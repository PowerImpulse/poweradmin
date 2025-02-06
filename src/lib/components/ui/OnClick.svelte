<script>
    let isOpen = false;
  
    function toggleDropdown() {
      isOpen = !isOpen;
    }
  </script>
  
  <style>
    .dropdown {
      position: relative;
      display: inline-block;
    }
  
    .dropdown-content {
      display: none;
      position: absolute;
      background-color: #f9f9f9;
      min-width: 160px;
      box-shadow: 0px 8px 16px 0px rgba(0, 0, 0, 0.2);
      z-index: 1;
    }
  
    .dropdown-content a {
      color: black;
      padding: 12px 16px;
      text-decoration: none;
      display: block;
    }
  
    .dropdown-content a:hover {
      background-color: #f1f1f1;
    }
  
    .show {
      display: block;
    }
  </style>
  
  <div class="dropdown">
    <button class="bg-blue-500 border-none pos-absolute right-0 top-0  text-white " on:click={toggleDropdown}>USER </button>
    <div class="dropdown-content" class:show={isOpen}>
      <a href="/">Link 1</a>
      <a href="/">Link 2</a>
      <a href="/">Link 3</a>
    </div>
  </div>
  