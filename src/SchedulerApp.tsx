import React, {useState} from 'react';

const platosEcuatorianos = {
    Encebollado: '/img/img.png',
    Bolon: '/img/img.png',
    Guatita: '/img/img.png',
    Fritada: '/img/img.png',
    SecoDePollo: '/img/img.png',
    Hornado: '/img/img.png',
    Ceviche: '/img/img.png',
    Llapingacho: '/img/img.png'
};

const getRandomPlato = () => {
    const keys = Object.keys(platosEcuatorianos);
    return keys[Math.floor(Math.random() * keys.length)];
};

const SchedulerApp = () => {
    const [algorithm, setAlgorithm] = useState('FIFO');
    const [pid, setPid] = useState('Encebollado');
    const [arrival, setArrival] = useState('');
    const [burst, setBurst] = useState('');
    const [priority, setPriority] = useState('');
    const [quantum, setQuantum] = useState('');
    const [processes, setProcesses] = useState([]);
    const [results, setResults] = useState([]);
    const [current, setCurrent] = useState(null);
    const [progress, setProgress] = useState(0);
    const [running, setRunning] = useState(false);

    const addProcess = () => {
        if (!pid || !arrival || !burst) return;
        const newProcess = {
            pid,
            arrival: parseInt(arrival),
            burst: parseInt(burst),
            priority: priority ? parseInt(priority) : undefined
        };
        setProcesses([...processes, newProcess]);
        setPid('Encebollado');
        setArrival('');
        setBurst('');
        setPriority('');
    };

    const resetSimulation = () => {
        setProcesses([]);
        setResults([]);
        setCurrent(null);
        setProgress(0);
        setRunning(false);
    };

    const addRandomProcesses = () => {
        const randomList = Array.from({length: 5}, (_, i) => ({
            pid: getRandomPlato(),
            arrival: Math.floor(Math.random() * 5),
            burst: Math.floor(Math.random() * 8 + 2),
            priority: algorithm === 'PRIORITY' ? Math.floor(Math.random() * 5 + 1) : undefined
        }));
        setProcesses([...processes, ...randomList]);
    };

    const runScheduler = () => {
        let scheduled = [];
        switch (algorithm) {
            case 'FIFO':
                scheduled = runFIFO(processes);
                break;
            case 'SJF':
                scheduled = runSJF(processes);
                break;
            case 'PRIORITY':
                scheduled = runPriority(processes);
                break;
            case 'ROUND_ROBIN':
                scheduled = runRoundRobin(processes, parseInt(quantum));
                break;
        }
        setResults([]);
        simulateCooking(scheduled);
    };

    const simulateCooking = async (scheduled) => {
        setRunning(true);
        for (const p of scheduled) {
            setCurrent(p);
            setProgress(0);
            for (let i = 0; i <= 100; i += 5) {
                setProgress(i);
                await new Promise(res => setTimeout(res, p.burst * 10));
            }
            setResults(prev => [...prev, p]);
        }
        setCurrent(null);
        setRunning(false);
    };

    const runFIFO = (list) => {
        const sorted = [...list].sort((a, b) => a.arrival - b.arrival);
        let time = 0;
        return sorted.map(p => {
            if (time < p.arrival) time = p.arrival;
            const start = time;
            const end = start + p.burst;
            const waitingTime = start - p.arrival;
            const turnaroundTime = end - p.arrival;
            time = end;
            return {...p, start, end, waitingTime, turnaroundTime};
        });
    };

    const runSJF = (list) => {
        const sorted = [...list];
        let time = 0, completed = [];
        while (sorted.length > 0) {
            const ready = sorted.filter(p => p.arrival <= time);
            if (ready.length === 0) {
                time++;
                continue;
            }
            const next = ready.sort((a, b) => a.burst - b.burst)[0];
            sorted.splice(sorted.indexOf(next), 1);
            const start = time;
            const end = start + next.burst;
            const waitingTime = start - next.arrival;
            const turnaroundTime = end - next.arrival;
            time = end;
            completed.push({...next, start, end, waitingTime, turnaroundTime});
        }
        return completed;
    };

    const runPriority = (list) => {
        const sorted = [...list];
        let time = 0, completed = [];
        while (sorted.length > 0) {
            const ready = sorted.filter(p => p.arrival <= time);
            if (ready.length === 0) {
                time++;
                continue;
            }
            const next = ready.sort((a, b) => a.priority - b.priority)[0];
            sorted.splice(sorted.indexOf(next), 1);
            const start = time;
            const end = start + next.burst;
            const waitingTime = start - next.arrival;
            const turnaroundTime = end - next.arrival;
            time = end;
            completed.push({...next, start, end, waitingTime, turnaroundTime});
        }
        return completed;
    };

    const runRoundRobin = (list, q) => {
        const queue = [...list].map(p => ({...p}));
        let time = 0, results = [];
        let remaining = queue.map(p => ({...p, remaining: p.burst}));
        const readyQueue = [];
        while (remaining.length > 0 || readyQueue.length > 0) {
            for (let p of remaining.filter(p => p.arrival <= time)) {
                if (!readyQueue.includes(p)) readyQueue.push(p);
            }
            remaining = remaining.filter(p => !readyQueue.includes(p));
            if (readyQueue.length === 0) {
                time++;
                continue;
            }
            const current = readyQueue.shift();
            const start = time;
            const execTime = Math.min(current.remaining, q);
            time += execTime;
            current.remaining -= execTime;
            if (current.remaining > 0) {
                for (let p of remaining.filter(p => p.arrival <= time && !readyQueue.includes(p))) {
                    readyQueue.push(p);
                }
                readyQueue.push(current);
            } else {
                const end = time;
                const waitingTime = end - current.arrival - current.burst;
                const turnaroundTime = end - current.arrival;
                results.push({...current, start, end, waitingTime, turnaroundTime});
            }
        }
        return results;
    };

    return (
        <div className="p-6 font-mono max-w-full mx-auto">
            <h1 className="text-xl font-bold mb-4">🍽️ Simulador de Cocina con Algoritmos de Planificación</h1>

            <div className="flex flex-wrap gap-2 items-center mb-4">
                <label className="font-semibold">Algoritmo:</label>
                <select className="border px-2 py-1" value={algorithm} onChange={e => setAlgorithm(e.target.value)}>
                    <option value="FIFO">FIFO</option>
                    <option value="SJF">SJF</option>
                    <option value="PRIORITY">Prioridad</option>
                    <option value="ROUND_ROBIN">Round Robin</option>
                </select>
                {algorithm === 'ROUND_ROBIN' && (
                    <input className="border px-2 py-1" type="number" placeholder="Quantum" value={quantum}
                           onChange={e => setQuantum(e.target.value)}/>
                )}
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
                <select className="border px-2 py-1" value={pid} onChange={e => setPid(e.target.value)}>
                    {Object.keys(platosEcuatorianos).map(plato => (
                        <option key={plato} value={plato}>{plato}</option>
                    ))}
                </select>
                <input className="border px-2 py-1" type="number" placeholder="Llegada" value={arrival}
                       onChange={e => setArrival(e.target.value)}/>
                <input className="border px-2 py-1" type="number" placeholder="Tiempo" value={burst}
                       onChange={e => setBurst(e.target.value)}/>
                {algorithm === 'PRIORITY' && (
                    <input className="border px-2 py-1" type="number" placeholder="Prioridad" value={priority}
                           onChange={e => setPriority(e.target.value)}/>
                )}
                <button className="bg-blue-500 text-white px-3" onClick={addProcess}>Agregar Plato</button>
                <button className="bg-green-600 text-white px-3" onClick={runScheduler} disabled={running}>Ejecutar
                </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
                <button className="bg-purple-500 text-white px-3 py-1" onClick={addRandomProcesses}
                        disabled={running}>Agregar Aleatorios
                </button>
                <button className="bg-red-500 text-white px-3 py-1" onClick={resetSimulation} disabled={running}>Reset
                </button>
            </div>

            {processes.length > 0 && (
                <>
                    <h2 className="font-bold mt-4">📝 Procesos Pendientes:</h2>
                    <table className="table-auto w-full border border-collapse mb-4">
                        <thead>
                        <tr className="bg-gray-100">
                            <th className="border px-2 py-1">Plato</th>
                            <th className="border px-2 py-1">Llegada</th>
                            <th className="border px-2 py-1">Tiempo</th>
                            {algorithm === 'PRIORITY' && (
                                <th className="border px-2 py-1">Prioridad</th>
                            )}
                        </tr>
                        </thead>
                        <tbody>
                        {processes.map((p, i) => (
                            <tr key={i} className="text-center">
                                <td className="border px-2 py-1">{p.pid}</td>
                                <td className="border px-2 py-1">{p.arrival}</td>
                                <td className="border px-2 py-1">{p.burst}</td>
                                {algorithm === 'PRIORITY' && (
                                    <td className="border px-2 py-1">{p.priority}</td>
                                )}
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </>
            )}


            {current && (
                <div className="mb-4 text-center">
                    <img src={platosEcuatorianos[current.pid] || '/img/default.png'} alt={current.pid}
                         className="mx-auto w-40"/>
                    <p className="mt-2">Cocinando <strong>{current.pid}</strong> de t={current.start} a t={current.end}
                    </p>
                    <div className="h-4 bg-gray-200 w-full rounded">
                        <div className="h-4 bg-blue-500 rounded" style={{width: `${progress}%`}}/>
                    </div>
                </div>
            )}

            {results.length > 0 && (
                <>
                    <h2 className="font-bold mt-6">Resultados:</h2>

                    <div className="overflow-x-auto mt-4 mb-6 border rounded p-4 w-full">
                        <div className="flex flex-row flex-wrap gap-3 justify-start">
                            {results.map((r, i) => (
                                <div
                                    key={i}
                                    className="flex flex-col items-center border px-3 py-2 shadow rounded bg-blue-50 min-w-[120px]"
                                >
                                    <img
                                        src={platosEcuatorianos[r.pid] || '/img/default.png'}
                                        alt={r.pid}
                                        className="w-12 h-12 object-contain mb-1"
                                    />
                                    <div className="text-xs text-center">
                                        <strong>{r.pid}</strong><br />
                                        t={r.start} → {r.end}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <table className="table-auto w-full border border-collapse">
                        <thead>
                        <tr className="bg-gray-200">
                            <th className="border px-2 py-1">Plato</th>
                            <th className="border px-2 py-1">Inicio</th>
                            <th className="border px-2 py-1">Fin</th>
                            <th className="border px-2 py-1">Espera</th>
                            <th className="border px-2 py-1">Retorno</th>
                        </tr>
                        </thead>
                        <tbody>
                        {results.map((r, i) => (
                            <tr key={i} className="text-center">
                                <td className="border px-2 py-1">{r.pid}</td>
                                <td className="border px-2 py-1">{r.start}</td>
                                <td className="border px-2 py-1">{r.end}</td>
                                <td className="border px-2 py-1">{r.waitingTime}</td>
                                <td className="border px-2 py-1">{r.turnaroundTime}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>

                    <div className="mt-4 text-sm text-right text-gray-700">
                        <p>⏳ Espera promedio: {(results.reduce((sum, r) => sum + r.waitingTime, 0) / results.length).toFixed(2)}</p>
                        <p>🔁 Retorno promedio: {(results.reduce((sum, r) => sum + r.turnaroundTime, 0) / results.length).toFixed(2)}</p>
                    </div>
                </>
            )}
            {!running && processes.length > 0 && results.length === processes.length && (
                <p className="text-green-700 font-semibold mt-4">✅ Todos los platos han sido preparados.</p>
            )}

        </div>
    );
};

export default SchedulerApp;
