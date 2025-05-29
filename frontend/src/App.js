// import React, { useState, useEffect, useCallback } from 'react';
// import axios from 'axios';
// import imgDesign from './assets/img-design.png';
import AppBar from './components/AppBar/AppBar';
import BoardBar from './components/BoardBar/BoardBar';
import BoardContent from './components/BoardContent/BoardContent';

function App() {
  return (
    <div className="trello-master">
      <AppBar />
      <BoardBar />
      <BoardContent />
    </div>
  );
}

export default App;