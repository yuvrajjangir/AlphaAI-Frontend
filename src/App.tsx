import { PeopleList } from './components/PeopleList';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Research Dashboard
        </h1>
        <PeopleList />
      </div>
    </div>
  );
}

export default App;
