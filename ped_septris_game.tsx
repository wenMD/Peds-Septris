import React, { useState, useEffect, useRef } from 'react';

const DrSepsisJr = () => {
  const [gameState, setGameState] = useState('menu');
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [score, setScore] = useState(0);
  const [gameTime, setGameTime] = useState(0);
  const [activeOrderCategory, setActiveOrderCategory] = useState('labs');
  const [level, setLevel] = useState(1);
  const [appliedOrders, setAppliedOrders] = useState([]);
  
  const gameLoopRef = useRef(null);

  const level1Patients = [
    {
      id: 1,
      name: "Jane Johnson",
      age: "3 years",
      weight: "15 kg",
      mrn: "12345678",
      location: "PICU Bed 204",
      chief_complaint: "Fever and decreased feeding",
      history: "Previously healthy 3-year-old with 2 days of fever, vomiting, and decreased oral intake",
      vitals: { temp: 39.2, hr: 140, rr: 32, bp_systolic: 85, bp_diastolic: 45, spo2: 97, map: 58, weight: 15 },
      physical_exam: "Ill-appearing, poor capillary refill (3 sec), dry mucous membranes, no rash",
      correct_treatments: ['blood_culture', 'iv_access', 'fluid_bolus', 'antibiotics', 'labs']
    },
    {
      id: 2,
      name: "Marcus Chen",
      age: "8 months", 
      weight: "8 kg",
      mrn: "87654321",
      location: "PICU Bed 206",
      chief_complaint: "Respiratory distress and fever",
      history: "8-month-old with URI symptoms x 3 days, now with increased work of breathing",
      vitals: { temp: 38.8, hr: 160, rr: 45, bp_systolic: 70, bp_diastolic: 40, spo2: 92, map: 50, weight: 8 },
      physical_exam: "Moderate respiratory distress, retractions, decreased breath sounds RLL",
      correct_treatments: ['blood_culture', 'iv_access', 'fluid_bolus', 'antibiotics', 'chest_xray', 'o2_support']
    }
  ];

  const level2Patients = [
    {
      id: 3,
      name: "Sofia Rodriguez",
      age: "6 years",
      weight: "20 kg",
      mrn: "11122334",
      location: "PICU Bed 208",
      chief_complaint: "Abdominal pain and fever",
      history: "6-year-old with 24 hours of severe abdominal pain, fever, and vomiting",
      vitals: { temp: 39.8, hr: 150, rr: 28, bp_systolic: 80, bp_diastolic: 50, spo2: 98, map: 60, weight: 20 },
      physical_exam: "Appears toxic, RLQ tenderness with guarding, positive McBurney's sign",
      correct_treatments: ['blood_culture', 'iv_access', 'fluid_bolus', 'antibiotics', 'labs', 'ct_abdomen', 'surgery_consult']
    }
  ];

  const getCurrentPatients = () => {
    return level === 1 ? level1Patients : level2Patients;
  };

  const treatments = {
    labs: {
      name: "Laboratory",
      orders: {
        blood_culture: { name: "Blood Culture", epic_name: "BLOOD CULTURE AEROBIC/ANAEROBIC", essential: true, points: 20 },
        labs: { name: "CBC w/ Diff, CMP, Lactate", epic_name: "SEPSIS PANEL PEDIATRIC", essential: true, points: 20 }
      }
    },
    medications: {
      name: "Medications", 
      orders: {
        antibiotics: { name: "Ceftriaxone 50mg/kg IV", epic_name: "cefTRIAXone injection", essential: true, points: 35 },
        fluid_bolus: { name: "NS 20ml/kg IV Bolus", epic_name: "sodium chloride 0.9% bolus", essential: true, points: 30 }
      }
    },
    procedures: {
      name: "Procedures",
      orders: {
        iv_access: { name: "IV Access", epic_name: "PERIPHERAL IV INSERTION", essential: true, points: 25 },
        o2_support: { name: "Oxygen Therapy", epic_name: "OXYGEN THERAPY", essential: false, points: 25 }
      }
    },
    imaging: {
      name: "Radiology",
      orders: {
        chest_xray: { name: "Chest X-ray", epic_name: "XR CHEST PA AND LAT PORTABLE", essential: false, points: 15 },
        ct_abdomen: { name: "CT Abdomen/Pelvis", epic_name: "CT ABDOMEN PELVIS W/WO CONTRAST", essential: false, points: 20 }
      }
    },
    consults: {
      name: "Consults",
      orders: {
        surgery_consult: { name: "Pediatric Surgery Consult", epic_name: "CONSULT PEDIATRIC SURGERY", essential: false, points: 30 }
      }
    }
  };

  const initializePatients = () => {
    const currentPatients = getCurrentPatients();
    const newPatients = currentPatients.map((template, index) => ({
      ...template,
      id: Date.now() + index,
      health: 50,
      position: 50,
      appliedTreatments: [],
      timeElapsed: 0,
      status: 'active',
      needsAttention: false
    }));
    setPatients(newPatients);
    setSelectedPatient(newPatients[0]);
    setAppliedOrders([]);
  };

  useEffect(() => {
    if (gameState === 'playing') {
      gameLoopRef.current = setInterval(() => {
        setGameTime(prev => prev + 1);
        
        setPatients(prevPatients => {
          const updatedPatients = prevPatients.map(patient => {
            if (patient.status !== 'active') return patient;
            
            let healthDelta = -1;
            const allTreatments = Object.values(treatments).reduce((acc, category) => {
              return { ...acc, ...category.orders };
            }, {});
            
            const hasEssentialTreatments = patient.correct_treatments
              .filter(treatment => allTreatments[treatment] && allTreatments[treatment].essential)
              .every(treatment => patient.appliedTreatments.includes(treatment));
            
            if (hasEssentialTreatments) {
              healthDelta = 2;
            } else if (patient.appliedTreatments.length > 0) {
              healthDelta = -0.5;
            }
            
            const newHealth = Math.max(0, Math.min(100, patient.health + healthDelta));
            const newPosition = Math.max(5, Math.min(95, patient.position + (healthDelta > 0 ? 1 : -1)));
            
            if (newHealth <= 0 || newPosition <= 5) {
              return { ...patient, status: 'died', health: 0, position: 5 };
            } else if (newHealth >= 90 && newPosition >= 90) {
              return { ...patient, status: 'cured', health: 100, position: 95 };
            }
            
            return {
              ...patient,
              health: newHealth,
              position: newPosition,
              timeElapsed: patient.timeElapsed + 1,
              needsAttention: newHealth < 30 && !hasEssentialTreatments
            };
          });
          
          // Check if all patients are saved and level can advance
          const allPatientsSaved = updatedPatients.every(p => p.status === 'cured');
          if (allPatientsSaved && level === 1) {
            setTimeout(() => {
              setLevel(2);
              initializePatients();
            }, 2000);
          }
          
          return updatedPatients;
        });
      }, 4000);
    } else {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    }

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [gameState]);

  const applyTreatment = (treatmentId) => {
    if (!selectedPatient || selectedPatient.status !== 'active') return;

    const allTreatments = Object.values(treatments).reduce((acc, category) => {
      return { ...acc, ...category.orders };
    }, {});
    
    const treatment = allTreatments[treatmentId];
    const isCorrect = selectedPatient.correct_treatments.includes(treatmentId);
    const alreadyApplied = selectedPatient.appliedTreatments.includes(treatmentId);

    if (alreadyApplied) return;

    // Add visual feedback for applied order
    setAppliedOrders(prev => [...prev, treatmentId]);
    setTimeout(() => {
      setAppliedOrders(prev => prev.filter(id => id !== treatmentId));
    }, 1000);

    setPatients(prevPatients =>
      prevPatients.map(patient => {
        if (patient.id === selectedPatient.id) {
          const updatedTreatments = [...patient.appliedTreatments, treatmentId];
          const healthBonus = isCorrect ? 10 : -5;
          
          return {
            ...patient,
            appliedTreatments: updatedTreatments,
            health: Math.max(0, Math.min(100, patient.health + healthBonus))
          };
        }
        return patient;
      })
    );

    const pointsEarned = isCorrect ? treatment.points : -10;
    setScore(prev => Math.max(0, prev + pointsEarned));
  };

  const startGame = () => {
    setLevel(1);
    initializePatients();
    setGameState('playing');
    setScore(0);
    setGameTime(0);
  };

  const restartGame = () => {
    setLevel(1);
    initializePatients();
    setScore(0);
    setGameTime(0);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (gameState === 'menu') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mr-4">
              <span className="text-white text-2xl">❤️</span>
            </div>
            <div>
              <h1 className="text-5xl font-bold text-gray-800 mb-2">Peds Septris</h1>
              <p className="text-xl text-gray-600">Pediatric Sepsis Management Training</p>
              <p className="text-sm text-gray-500 mt-2">Epic EMR Simulation • LPCH Edition</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full">
          <button
            onClick={startGame}
            className="flex items-center justify-center p-8 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            <span className="text-2xl mr-3">▶️</span>
            Enter Epic Simulation
          </button>
          
          <button
            onClick={() => setGameState('resources')}
            className="flex items-center justify-center p-8 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            <span className="text-2xl mr-3">📚</span>
            Clinical Resources
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'resources') {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Clinical Resources</h1>
            <button
              onClick={() => setGameState('menu')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Back to Menu
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-4 text-blue-600">Pediatric Sepsis Guidelines</h2>
              <div className="space-y-4 text-sm">
                <div>
                  <h3 className="font-semibold">Recognition Criteria:</h3>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Age-specific vital sign abnormalities</li>
                    <li>Signs of tissue hypoperfusion</li>
                    <li>Organ dysfunction indicators</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold">Initial Management:</h3>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>20 ml/kg fluid bolus (repeat PRN, max 60 ml/kg)</li>
                    <li>Broad-spectrum antibiotics within 1 hour</li>
                    <li>Source control when indicated</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-4 text-green-600">Age-Specific Vital Signs</h2>
              <div className="space-y-3 text-sm">
                <div className="bg-gray-50 p-3 rounded">
                  <h4 className="font-semibold">Infant (1-12 months)</h4>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                    <div>HR: 100-160 bpm</div>
                    <div>RR: 20-30 rpm</div>
                    <div>SBP: &gt;70 mmHg</div>
                    <div>Weight: 3-10 kg</div>
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <h4 className="font-semibold">Toddler (1-3 years)</h4>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                    <div>HR: 90-150 bpm</div>
                    <div>RR: 20-30 rpm</div>
                    <div>SBP: &gt;75 mmHg</div>
                    <div>Weight: 10-15 kg</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-800 text-white p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
              <span className="text-blue-800 font-bold text-sm">E</span>
            </div>
            <span className="font-bold">Epic Hyperspace</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm">Level: {level}</span>
            <span className="text-sm">Score: {score}</span>
            <span className="text-sm">Time: {formatTime(gameTime)}</span>
            <button 
              onClick={restartGame} 
              className="bg-green-700 hover:bg-green-600 px-3 py-1 rounded text-sm"
            >
              Restart
            </button>
            <button 
              onClick={() => setGameState('menu')} 
              className="bg-blue-700 hover:bg-blue-600 px-3 py-1 rounded text-sm"
            >
              Exit
            </button>
          </div>
        </div>
      </div>

      <div className="flex">
        <div className="w-80 bg-white border-r min-h-screen">
          <div className="p-4 border-b bg-gray-50">
            <h2 className="font-semibold text-gray-800">👥 My Patient List - PICU</h2>
            <p className="text-xs text-gray-600 mt-1">Active Patients: {patients.length}</p>
          </div>
          
          <div className="divide-y">
            {patients.map(patient => (
              <div
                key={patient.id}
                className={`p-4 cursor-pointer hover:bg-gray-50 ${
                  selectedPatient?.id === patient.id ? 'bg-blue-50 border-r-4 border-blue-500' : ''
                }`}
                onClick={() => setSelectedPatient(patient)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-gray-900">{patient.name}</span>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        patient.status === 'cured' ? 'bg-green-100 text-green-800' :
                        patient.status === 'died' ? 'bg-red-100 text-red-800' :
                        patient.needsAttention ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {patient.status === 'active' ? 'ACTIVE' : 
                         patient.status === 'cured' ? 'STABLE' : 'CRITICAL'}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      <div>MRN: {patient.mrn}</div>
                      <div>{patient.age} • {patient.location}</div>
                      <div className="text-xs mt-1">{patient.chief_complaint}</div>
                    </div>
                  </div>
                  
                  {patient.needsAttention && (
                    <span className="text-red-500 animate-pulse text-lg">⚠️</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {selectedPatient && (
            <div className="border-t bg-purple-50">
              <div className="p-3 border-b bg-purple-100">
                <h3 className="font-semibold text-purple-800 text-sm">
                  📊 Patient Status - Level {level}
                </h3>
              </div>
              
              <div className="p-3">
                <div className="text-center mb-3">
                  <div className="font-semibold text-sm">{selectedPatient.name}</div>
                  <div className="text-xs text-gray-600">{selectedPatient.age} • {selectedPatient.weight}</div>
                </div>

                <div className="relative bg-gradient-to-b from-green-100 via-yellow-100 to-red-100 rounded-lg h-64 border-2 border-gray-300 overflow-hidden">
                  
                  <div className="absolute bottom-0 left-0 right-0 h-12 bg-red-500 bg-opacity-30 border-t-2 border-red-600 flex items-center justify-center">
                    <span className="text-red-800 font-bold text-xs animate-pulse">⚠ CRITICAL ⚠</span>
                  </div>
                  
                  <div className="absolute top-0 left-0 right-0 h-12 bg-green-500 bg-opacity-30 border-b-2 border-green-600 flex items-center justify-center">
                    <span className="text-green-800 font-bold text-xs">✓ RECOVERY ✓</span>
                  </div>

                  <div 
                    className="absolute left-1/2 transform -translate-x-1/2 transition-all duration-1000 ease-in-out"
                    style={{ 
                      top: `${100 - selectedPatient.position}%`,
                      transform: `translateX(-50%) translateY(-50%)`
                    }}
                  >
                    <div className={`relative w-14 h-14 rounded-full border-4 shadow-lg transition-all duration-500 ${
                      selectedPatient.position > 70 ? 'border-green-500 bg-green-100' :
                      selectedPatient.position > 40 ? 'border-yellow-500 bg-yellow-100' :
                      selectedPatient.position > 15 ? 'border-orange-500 bg-orange-100' :
                      'border-red-500 bg-red-100'
                    }`}>
                      
                      <div className="w-full h-full flex items-center justify-center text-xl">
                        {selectedPatient.status === 'died' ? '💀' :
                         selectedPatient.status === 'cured' ? '😊' :
                         selectedPatient.position > 70 ? '😊' :
                         selectedPatient.position > 40 ? '😐' :
                         selectedPatient.position > 15 ? '😰' : '😵'}
                      </div>

                      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-white px-2 py-1 rounded shadow text-xs font-medium whitespace-nowrap">
                        {selectedPatient.name.split(' ')[0]}
                      </div>
                    </div>

                    {selectedPatient.status === 'active' && selectedPatient.health < 50 && (
                      <div className="absolute -right-10 top-0 flex flex-col items-center">
                        <div className="text-red-500 animate-bounce text-lg">↓</div>
                        <span className="text-xs text-red-600 font-bold">FALLING</span>
                      </div>
                    )}

                    {selectedPatient.status === 'active' && selectedPatient.health > 60 && (
                      <div className="absolute -right-10 top-0 flex flex-col items-center">
                        <div className="text-green-500 animate-bounce text-lg">↑</div>
                        <span className="text-xs text-green-600 font-bold">RISING</span>
                      </div>
                    )}
                  </div>

                  <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
                    {Math.round(selectedPatient.health)}%
                  </div>

                  <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
                    {Math.floor(selectedPatient.timeElapsed / 60)}:{(selectedPatient.timeElapsed % 60).toString().padStart(2, '0')}
                  </div>

                  {selectedPatient.status === 'died' && (
                    <div className="absolute inset-0 bg-red-500 bg-opacity-90 flex items-center justify-center">
                      <div className="text-center text-white">
                        <div className="text-3xl mb-2">💀</div>
                        <div className="font-bold">PATIENT LOST</div>
                        <div className="text-xs">Treatment too late</div>
                      </div>
                    </div>
                  )}

                  {selectedPatient.status === 'cured' && (
                    <div className="absolute inset-0 bg-green-500 bg-opacity-90 flex items-center justify-center">
                      <div className="text-center text-white">
                        <div className="text-3xl mb-2">🎉</div>
                        <div className="font-bold">PATIENT SAVED</div>
                        <div className="text-xs">Excellent work!</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 p-4">
          {selectedPatient ? (
            <div className="space-y-4">
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <h1 className="text-2xl font-bold text-gray-900">{selectedPatient.name}</h1>
                <div className="text-sm text-gray-600">
                  MRN: {selectedPatient.mrn} • {selectedPatient.age} • {selectedPatient.weight} • {selectedPatient.location}
                </div>
              </div>

              <div className="bg-black text-white p-4 rounded-lg border-2 border-gray-600">
                <div className="text-center mb-4">
                  <span className="text-blue-400 font-bold">PHILIPS IntelliVue Monitor</span>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-red-400 text-lg font-bold">ECG</div>
                    <div className={`text-3xl font-bold ${selectedPatient.vitals.hr > 150 ? 'text-yellow-400' : 'text-green-400'}`}>
                      {selectedPatient.vitals.hr}
                    </div>
                    <div className="text-xs text-gray-400">HR bpm</div>
                  </div>

                  <div className="text-center">
                    <div className="text-red-400 text-lg font-bold">BP</div>
                    <div className={`text-2xl font-bold ${selectedPatient.vitals.bp_systolic < 80 ? 'text-yellow-400' : 'text-green-400'}`}>
                      {selectedPatient.vitals.bp_systolic}/{selectedPatient.vitals.bp_diastolic}
                    </div>
                    <div className="text-sm text-green-400">({selectedPatient.vitals.map})</div>
                    <div className="text-xs text-gray-400">mmHg</div>
                  </div>

                  <div className="text-center">
                    <div className="text-blue-400 text-lg font-bold">SpO₂</div>
                    <div className={`text-3xl font-bold ${selectedPatient.vitals.spo2 < 95 ? 'text-yellow-400' : 'text-green-400'}`}>
                      {selectedPatient.vitals.spo2}%
                    </div>
                    <div className="text-xs text-gray-400">Pulse {selectedPatient.vitals.hr}</div>
                  </div>

                  <div className="text-center">
                    <div className="text-yellow-400 text-lg font-bold">TEMP</div>
                    <div className={`text-2xl font-bold ${selectedPatient.vitals.temp > 38.5 ? 'text-red-400' : 'text-green-400'}`}>
                      {selectedPatient.vitals.temp}°C
                    </div>
                    <div className="text-xs text-gray-400">Core</div>
                  </div>

                  <div className="text-center">
                    <div className="text-cyan-400 text-lg font-bold">RESP</div>
                    <div className={`text-3xl font-bold ${selectedPatient.vitals.rr > 30 ? 'text-yellow-400' : 'text-green-400'}`}>
                      {selectedPatient.vitals.rr}
                    </div>
                    <div className="text-xs text-gray-400">rpm</div>
                  </div>

                  <div className="text-center">
                    <div className="text-purple-400 text-lg font-bold">WT</div>
                    <div className="text-2xl font-bold text-green-400">
                      {selectedPatient.vitals.weight}
                    </div>
                    <div className="text-xs text-gray-400">kg</div>
                  </div>
                </div>

                {selectedPatient.needsAttention && (
                  <div className="mt-4 bg-red-600 text-white text-center p-2 rounded animate-pulse">
                    ⚠ PHYSIOLOGICAL ALARM ⚠
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-lg shadow-sm border">
                  <div className="p-4 border-b bg-gray-50">
                    <h2 className="font-semibold text-gray-800">📋 Place Orders</h2>
                  </div>
                  
                  <div className="p-4">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {Object.entries(treatments).map(([key, category]) => (
                        <button
                          key={key}
                          onClick={() => setActiveOrderCategory(key)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            activeOrderCategory === key
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {category.name}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-2">
                      {Object.entries(treatments[activeOrderCategory].orders).map(([id, order]) => {
                        const isApplied = selectedPatient.appliedTreatments.includes(id);
                        const isCorrect = selectedPatient.correct_treatments.includes(id);
                        const isJustApplied = appliedOrders.includes(id);
                        
                        return (
                          <button
                            key={id}
                            onClick={() => applyTreatment(id)}
                            disabled={isApplied || selectedPatient.status !== 'active'}
                            className={`w-full text-left p-3 border-2 rounded-lg transition-all duration-200 ${
                              isJustApplied
                                ? 'border-blue-500 bg-blue-100 animate-pulse'
                                : isApplied
                                ? isCorrect
                                  ? 'border-green-300 bg-green-50'
                                  : 'border-yellow-300 bg-yellow-50'
                                : selectedPatient.status !== 'active'
                                ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                                : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-gray-900">{order.epic_name}</div>
                                <div className="text-sm text-gray-600">{order.name}</div>
                              </div>
                              <div className="flex items-center space-x-2">
                                {isJustApplied && <span className="text-blue-600 font-bold">PLACING...</span>}
                                {isApplied && !isJustApplied && (
                                  <span className="text-sm">
                                    {isCorrect ? '✅' : '⚠️'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border">
                  <div className="p-4 border-b bg-gray-50">
                    <h2 className="font-semibold text-gray-800">📄 Chart Review</h2>
                  </div>
                  
                  <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                    <div>
                      <h3 className="font-semibold text-gray-800 border-b pb-1">Chief Complaint</h3>
                      <p className="text-sm text-gray-700 mt-2">{selectedPatient.chief_complaint}</p>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-gray-800 border-b pb-1">History of Present Illness</h3>
                      <p className="text-sm text-gray-700 mt-2">{selectedPatient.history}</p>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-gray-800 border-b pb-1">Physical Examination</h3>
                      <p className="text-sm text-gray-700 mt-2">{selectedPatient.physical_exam}</p>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-gray-800 border-b pb-1">Active Orders</h3>
                      <div className="mt-2 space-y-1">
                        {selectedPatient.appliedTreatments.length > 0 ? (
                          selectedPatient.appliedTreatments.map(treatmentId => {
                            const allTreatments = Object.values(treatments).reduce((acc, category) => {
                              return { ...acc, ...category.orders };
                            }, {});
                            const treatment = allTreatments[treatmentId];
                            const isCorrect = selectedPatient.correct_treatments.includes(treatmentId);
                            
                            return (
                              <div key={treatmentId} className={`flex items-center justify-between text-sm p-2 rounded ${
                                isCorrect ? 'bg-green-50 text-green-800' : 'bg-yellow-50 text-yellow-800'
                              }`}>
                                <div className="flex items-center">
                                  <span className="mr-2">{isCorrect ? '✅' : '⚠️'}</span>
                                  <span className="font-medium">{treatment.epic_name}</span>
                                </div>
                                <span className="text-xs">ACTIVE</span>
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-sm text-gray-500 italic">No active orders</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-800 border-b pb-1">Assessment & Plan</h3>
                      <div className="mt-2 space-y-2">
                        <div className="bg-blue-50 p-2 rounded">
                          <div className="font-medium text-blue-800 text-sm">1. Suspected Pediatric Sepsis</div>
                          <div className="text-xs text-blue-700 mt-1">
                            - Monitor vital signs closely<br/>
                            - Consider sepsis bundle protocol<br/>
                            - Reassess response to interventions
                          </div>
                        </div>
                        {selectedPatient.name === 'Marcus Chen' && (
                          <div className="bg-orange-50 p-2 rounded">
                            <div className="font-medium text-orange-800 text-sm">2. Pneumonia</div>
                            <div className="text-xs text-orange-700 mt-1">
                              - Chest imaging as indicated<br/>
                              - Respiratory support PRN<br/>
                              - Monitor oxygen requirements
                            </div>
                          </div>
                        )}
                        {selectedPatient.name === 'Sofia Rodriguez' && (
                          <div className="bg-red-50 p-2 rounded">
                            <div className="font-medium text-red-800 text-sm">2. Acute Appendicitis with Sepsis</div>
                            <div className="text-xs text-red-700 mt-1">
                              - Urgent surgical consultation<br/>
                              - CT scan for confirmation<br/>
                              - Source control required
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg shadow-sm border border-purple-200 p-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-purple-100 p-2 rounded-full">
                    <span className="text-purple-600">💡</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-purple-800 mb-2">Clinical Decision Support</h3>
                    <div className="space-y-2">
                      <div className="bg-white bg-opacity-60 p-3 rounded border-l-4 border-purple-500">
                        <div className="flex items-center">
                          <span className="mr-2">🚨</span>
                          <span className="font-medium text-sm">Sepsis Alert</span>
                        </div>
                        <p className="text-sm text-gray-700 mt-1">
                          Patient meets criteria for pediatric sepsis screening. Consider early intervention bundle.
                        </p>
                      </div>
                      
                      {selectedPatient.health < 50 && (
                        <div className="bg-red-50 p-3 rounded border-l-4 border-red-500">
                          <div className="flex items-center">
                            <span className="mr-2">⚠️</span>
                            <span className="font-medium text-sm text-red-800">Critical Alert</span>
                          </div>
                          <p className="text-sm text-red-700 mt-1">
                            Patient condition deteriorating. Review sepsis bundle completion.
                          </p>
                        </div>
                      )}

                      {selectedPatient.appliedTreatments.includes('fluid_bolus') && (
                        <div className="bg-green-50 p-3 rounded border-l-4 border-green-500">
                          <div className="flex items-center">
                            <span className="mr-2">✅</span>
                            <span className="font-medium text-sm text-green-800">Good Practice</span>
                          </div>
                          <p className="text-sm text-green-700 mt-1">
                            Fluid resuscitation initiated. Monitor response and consider additional boluses if needed.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
              <span className="text-gray-400 text-6xl">👥</span>
              <h2 className="text-xl font-semibold text-gray-600 mb-2 mt-4">No Patient Selected</h2>
              <p className="text-gray-500">Select a patient from the left panel to begin clinical management.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DrSepsisJr;