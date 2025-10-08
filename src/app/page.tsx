"use client";

import { useState, useEffect } from "react";
import { Database } from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { defaultSchema } from "@/lib/placeholder-content";
import type { TableRow } from "@/lib/types";

import DbSchemaForm from "@/components/db-schema-form";
import SchemaOutput from "@/components/schema-output";

export default function Home() {
     const [schemaInput, setSchemaInput] = useState<string>(defaultSchema);
     const [jsonOutput, setJsonOutput] = useState<string>("");
     const [tableData, setTableData] = useState<TableRow[]>([]);
     const [isLoading, setIsLoading] = useState<boolean>(false);
     const [year, setYear] = useState("");
     const { toast } = useToast();

     useEffect(() => {
          setYear(new Date().getFullYear().toString());
     }, []);

     const handleGenerate = async (input: string) => {
          setIsLoading(true);
          setJsonOutput("");
          setTableData([]);
          try {
               const response = await fetch("/api/schema-generator", {
                    method: "POST",
                    headers: {
                         "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ input }),
               });

               if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
               }

               const data = await response.json();

               if (data.error) {
                    throw new Error(data.error);
               }

               setJsonOutput(data.result.jsonSchema);
               setTableData(data.result.tableData);
          } catch (error) {
               console.error("Error generating schema:", error);
               toast({
                    variant: "destructive",
                    title: "Error de Generación",
                    description:
                         "No se pudo generar el esquema. Por favor, intente de nuevo.",
               });
          } finally {
               setIsLoading(false);
          }
     };

     return (
          <main className="container mx-auto p-4 md:p-8">
               <header className="mb-8 text-center">
                    <div className="inline-flex items-center gap-3">
                         <Database className="h-10 w-10 text-primary" />
                         <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl font-headline">
                              EsquemaDB
                         </h1>
                    </div>
                    <p className="mt-3 text-lg text-muted-foreground">
                         Ingrese una definición de base de datos para generar un
                         esquema JSON y una tabla HTML.
                    </p>
               </header>

               <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
                    <DbSchemaForm
                         schemaInput={schemaInput}
                         setSchemaInput={setSchemaInput}
                         onSubmit={handleGenerate}
                         isLoading={isLoading}
                    />
                    <SchemaOutput
                         jsonOutput={jsonOutput}
                         tableData={tableData}
                         isLoading={isLoading}
                    />
               </div>
               <footer className="mt-12 text-center text-sm text-muted-foreground">
                    <p>&copy; {year} EsquemaDB. Creado con IA.</p>
               </footer>
          </main>
     );
}
