import React from 'react';
import BoardContent from './components/BoardContent/BoardContent';
import './App.scss';

const App = () => {
    return (
        <div className="app">
            <header className="app-header">
                <h1>BOARD CONTENT</h1>
            </header>
            <main className="app-main">
                <BoardContent />
            </main>
        </div>
    );
};

export default App;