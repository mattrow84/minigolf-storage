"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Papa from "papaparse";

const rows = ["A", "B", "C", "D", "E", "F", "G", "H"];

const drawerColors = [
  "bg-blue-500",
  "bg-green-500",
  "bg-red-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-orange-500",
  "bg-cyan-500",
  "bg-lime-500",
  "bg-indigo-500",
  "bg-yellow-500",
  "bg-teal-500",
  "bg-rose-500",
];

const drawerBackgrounds = [
  "bg-blue-50",
  "bg-green-50",
  "bg-red-50",
  "bg-purple-50",
  "bg-pink-50",
  "bg-orange-50",
  "bg-cyan-50",
  "bg-lime-50",
  "bg-indigo-50",
  "bg-yellow-50",
  "bg-teal-50",
  "bg-rose-50",
];

type BallType = {
  name: string;
  position: string;
  drawer: number;
};

type PositionsType = Record<string, string>;

export default function Home() {
  const [selected, setSelected] = useState("");
  const [search, setSearch] = useState("");

  const [balls, setBalls] = useState<
    BallType[]
  >([]);

  const [positions, setPositions] =
    useState<PositionsType>({});

  const [currentDrawer, setCurrentDrawer] =
    useState(1);

  const [newBall, setNewBall] =
    useState("");

  const [drawerPos, setDrawerPos] =
    useState("");

  const [movePosition, setMovePosition] =
    useState("");

  const [moveDrawer, setMoveDrawer] =
    useState("");

  const totalBalls = balls.length;

  const currentDrawerCount = balls.filter(
    (ball) => ball.drawer === currentDrawer
  ).length;

  const filteredBalls = balls.filter(
    (ball) =>
      ball.name
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  useEffect(() => {
    loadBalls();
  }, []);

  useEffect(() => {
    updateDrawerPositions();
  }, [balls, currentDrawer]);

  const loadBalls = async () => {
    const { data, error } = await supabase
      .from("balls")
      .select("*");

    if (error) {
      console.error(error);
      return;
    }

    setBalls(data || []);
  };

  const updateDrawerPositions = () => {
    const formatted: PositionsType = {};

    balls
      .filter(
        (ball) =>
          ball.drawer === currentDrawer
      )
      .forEach((ball) => {
        formatted[ball.position] = ball.name;
      });

    setPositions(formatted);
  };

  const importCSV = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,

      complete: async (results: any) => {
        const rawData =
          results.data.map(
            (row: any) => ({
              name:
                row["name"] ||
                row["name "],
              drawer: Number(
                row.drawer
              ),
              position: row.position,
            })
          );

        const uniqueMap = new Map();

        rawData.forEach((ball: any) => {
          const key = `${ball.drawer}-${ball.position}`;

          uniqueMap.set(key, ball);
        });

        const formattedData =
          Array.from(
            uniqueMap.values()
          );

        const { error } =
          await supabase
            .from("balls")
            .upsert(formattedData, {
              onConflict:
                "drawer,position",
            });

        if (error) {
          console.error(error);
          alert(
            "Errore import CSV"
          );
          return;
        }

        await loadBalls();

        alert(
          `${formattedData.length} palline importate`
        );
      },
    });
  };

  const addBall = async () => {
    if (!newBall || !drawerPos) {
      alert("Compila tutti i campi");
      return;
    }

    if (positions[drawerPos]) {
      alert("Posizione occupata");
      return;
    }

    const { error } = await supabase
      .from("balls")
      .insert([
        {
          name: newBall,
          position: drawerPos,
          drawer: currentDrawer,
        },
      ]);

    if (error) {
      console.error(error);
      alert("Errore salvataggio");
      return;
    }

    await loadBalls();

    setNewBall("");
    setDrawerPos("");
  };

  const moveBall = async () => {
    if (!selected || !movePosition) {
      alert(
        "Inserisci nuova posizione"
      );
      return;
    }

    const targetDrawer = Number(
      moveDrawer || currentDrawer
    );

    const existingBall = balls.find(
      (ball) =>
        ball.drawer === targetDrawer &&
        ball.position === movePosition
    );

    if (existingBall) {
      alert("Posizione occupata");
      return;
    }

    const { error } = await supabase
      .from("balls")
      .update({
        position: movePosition,
        drawer: targetDrawer,
      })
      .eq("position", selected)
      .eq("drawer", currentDrawer);

    if (error) {
      console.error(error);
      alert("Errore spostamento");
      return;
    }

    await loadBalls();

    setCurrentDrawer(targetDrawer);

    setSelected(movePosition);

    setMovePosition("");
    setMoveDrawer("");
  };

  const deleteBall = async () => {
    const confirmDelete = confirm(
      `Eliminare ${positions[selected]}?`
    );

    if (!confirmDelete) return;

    const { error } = await supabase
      .from("balls")
      .delete()
      .eq("position", selected)
      .eq("drawer", currentDrawer);

    if (error) {
      console.error(error);
      alert("Errore eliminazione");
      return;
    }

    await loadBalls();

    setSelected("");
  };

  const printDrawer = () => {
    window.print();
  };

  const printStyles = `
@media print {

  body * {
    visibility: hidden;
  }

  .print-area,
  .print-area * {
    visibility: visible;
  }

  .print-area {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
  }
}
`;

  return (
    <main
      className={`
        min-h-screen p-6 transition-colors duration-500
        ${drawerBackgrounds[currentDrawer - 1]}
      `}
    >
      <style>{printStyles}</style>

      <h1 className="text-3xl font-bold mb-6">
        MiniGolf Storage
      </h1>

      <div className="mb-6 flex gap-3 flex-wrap">
        <label className="bg-black text-white px-4 py-2 rounded-xl cursor-pointer inline-block">
          Importa CSV

          <input
            type="file"
            accept=".csv"
            onChange={importCSV}
            className="hidden"
          />
        </label>

        <button
          onClick={printDrawer}
          className="bg-black text-white px-4 py-2 rounded-xl"
        >
          Stampa cassetto
        </button>
      </div>

      <div className="mb-6 flex flex-wrap gap-4">
        <div className="bg-white p-4 rounded-xl shadow">
          <div className="text-sm text-gray-500">
            Totale palline
          </div>

          <div className="text-2xl font-bold">
            {totalBalls}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          <div className="text-sm text-gray-500">
            Cassetto {currentDrawer}
          </div>

          <div className="text-2xl font-bold">
            {currentDrawerCount} / 64
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {Array.from(
          { length: 12 },
          (_, i) => (
            <button
              key={i}
              onClick={() =>
                setCurrentDrawer(i + 1)
              }
              className={`
              px-4 py-2 rounded-xl font-bold
              ${
                currentDrawer === i + 1
                  ? `${drawerColors[i]} text-white`
                  : "bg-white"
              }
            `}
            >
              Cassetto {i + 1}
            </button>
          )
        )}
      </div>

      <div className="mb-6 max-w-xl">
        <input
          type="text"
          placeholder="Cerca pallina..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          className="border p-3 rounded-xl w-full"
        />

        {search.trim() && (
          <div className="bg-white rounded-xl shadow mt-2 max-h-72 overflow-y-auto">
            {filteredBalls.length > 0 ? (
              filteredBalls.map(
                (ball, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setCurrentDrawer(
                        ball.drawer
                      );

                      setSelected(
                        ball.position
                      );
                    }}
                    className="w-full text-left p-3 border-b hover:bg-gray-100"
                  >
                    <div className="font-bold">
                      {ball.name}
                    </div>

                    <div className="text-sm text-gray-600">
                      Cassetto{" "}
                      {ball.drawer} —{" "}
                      {ball.position}
                    </div>
                  </button>
                )
              )
            ) : (
              <div className="p-3 text-gray-500">
                Nessun risultato
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mb-8 p-4 bg-white rounded-xl shadow max-w-md">
        <div className="text-xl font-bold">
          Cassetto:
          <span className="ml-2">
            {currentDrawer}
          </span>
        </div>

        <div className="text-xl font-bold mt-2">
          Posizione:
          <span className="ml-2">
            {selected || "-"}
          </span>
        </div>

        {selected && (
          <div className="mt-3 text-lg">
            {positions[selected] ? (
              <div className="flex flex-col gap-4">
                <div>
                  Occupata da:
                  <span className="font-bold ml-2">
                    {
                      positions[
                        selected
                      ]
                    }
                  </span>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <input
                    type="number"
                    min="1"
                    max="12"
                    placeholder="Cassetto"
                    value={moveDrawer}
                    onChange={(e) =>
                      setMoveDrawer(
                        e.target.value
                      )
                    }
                    className="border p-2 rounded-xl w-28"
                  />

                  <input
                    type="text"
                    placeholder="Nuova posizione"
                    value={movePosition}
                    onChange={(e) =>
                      setMovePosition(
                        e.target.value.toUpperCase()
                      )
                    }
                    className="border p-2 rounded-xl w-40"
                  />

                  <button
                    onClick={moveBall}
                    className="bg-yellow-500 text-white px-4 py-2 rounded-xl"
                  >
                    Sposta
                  </button>
                </div>

                <button
                  onClick={deleteBall}
                  className="bg-red-500 text-white px-4 py-2 rounded-xl w-fit"
                >
                  Elimina pallina
                </button>
              </div>
            ) : (
              "Posizione vuota"
            )}
          </div>
        )}
      </div>

      <div className="overflow-x-auto mb-10 print-area">
        <div className="grid grid-cols-8 gap-4 w-fit">
          {rows.flatMap((row) =>
            Array.from(
              { length: 8 },
              (_, i) => {
                const pos = `${row}${
                  i + 1
                }`;

                const occupied =
                  positions[pos];

                let color =
                  "bg-green-200 border-green-400";

                if (occupied) {
                  color =
                    "bg-red-300 border-red-500";
                }

                if (
                  selected === pos
                ) {
                  color =
                    "bg-yellow-400 border-yellow-700";
                }

                return (
                  <button
                    key={pos}
                    onClick={() => {
                      setSelected(pos);

                      if (
                        !occupied
                      ) {
                        setDrawerPos(
                          pos
                        );
                      }
                    }}
                    className={`
                    h-16 w-16 rounded-full border-2
                    font-bold text-black
                    transition-all duration-200
                    hover:scale-110
                    shadow-md
                    ${color}
                  `}
                    title={
                      occupied
                        ? `${occupied} (${pos})`
                        : `Posizione vuota (${pos})`
                    }
                  >
                    <div className="flex flex-col items-center justify-center h-full leading-none">
                      <span className="text-[9px] text-center break-words px-1">
                        {occupied
                          ? occupied
                          : pos}
                      </span>
                    </div>
                  </button>
                );
              }
            )
          )}
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow max-w-xl">
        <h2 className="font-bold text-xl mb-4">
          Aggiungi pallina
        </h2>

        <div className="flex gap-2 flex-wrap">
          <input
            type="text"
            placeholder="Nome pallina"
            value={newBall}
            onChange={(e) =>
              setNewBall(
                e.target.value
              )
            }
            className="border p-3 rounded-xl"
          />

          <input
            type="text"
            placeholder="Posizione (es. A4)"
            value={drawerPos}
            onChange={(e) =>
              setDrawerPos(
                e.target.value.toUpperCase()
              )
            }
            className="border p-3 rounded-xl w-40"
          />

          <button
            onClick={addBall}
            className="bg-green-500 text-white px-4 rounded-xl"
          >
            Aggiungi
          </button>
        </div>
      </div>
    </main>
  );
}