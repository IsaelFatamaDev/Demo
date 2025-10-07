"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";

interface DbSchemaFormProps {
  schemaInput: string;
  setSchemaInput: Dispatch<SetStateAction<string>>;
  onSubmit: (input: string) => void;
  isLoading: boolean;
}

export default function DbSchemaForm({
  schemaInput,
  setSchemaInput,
  onSubmit,
  isLoading,
}: DbSchemaFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(schemaInput);
  };

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Definición de Esquema</CardTitle>
        <CardDescription>
          Escriba o pegue la estructura de su base de datos a continuación.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit} className="flex flex-col flex-grow">
        <CardContent className="flex-grow">
          <Textarea
            value={schemaInput}
            onChange={(e) => setSchemaInput(e.target.value)}
            placeholder="Escriba la definición de su esquema aquí..."
            className="h-full min-h-[300px] resize-y text-base font-code"
            disabled={isLoading}
            aria-label="Schema Definition Input"
          />
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {isLoading ? "Generando..." : "Generar Esquema"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
