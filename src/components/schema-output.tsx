"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import type { TableRow as TableRowType } from "@/lib/types";
import { Code, Table as TableIcon } from "lucide-react";

interface SchemaOutputProps {
  jsonOutput: string;
  tableData: TableRowType[];
  isLoading: boolean;
}

const LoadingState = () => (
  <div className="space-y-4">
    <Skeleton className="h-8 w-1/4" />
    <Skeleton className="h-40 w-full" />
    <Skeleton className="h-8 w-1/3" />
    <Skeleton className="h-20 w-full" />
  </div>
);

const EmptyState = () => (
    <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg h-full">
        <div className="bg-muted p-4 rounded-full mb-4">
            <Code className="h-12 w-12"/>
        </div>
        <p className="text-lg font-medium">Aún no hay resultados</p>
        <p className="text-sm">
            Ingrese una definición y haga clic en 'Generar Esquema' para ver el resultado aquí.
        </p>
    </div>
);


export default function SchemaOutput({
  jsonOutput,
  tableData,
  isLoading,
}: SchemaOutputProps) {
  const hasContent = jsonOutput || tableData.length > 0;

  return (
    <Card className="min-h-[500px]">
      <CardHeader>
        <CardTitle>Resultado</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <LoadingState />
        ) : !hasContent ? (
          <EmptyState />
        ) : (
          <Tabs defaultValue="json" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="json">
                <Code className="mr-2 h-4 w-4" />
                Esquema JSON
              </TabsTrigger>
              <TabsTrigger value="table">
                <TableIcon className="mr-2 h-4 w-4" />
                Tabla HTML
              </TabsTrigger>
            </TabsList>
            <TabsContent value="json">
              <pre className="mt-4 w-full rounded-md bg-muted p-4 overflow-x-auto">
                <code className="text-muted-foreground font-code">{jsonOutput}</code>
              </pre>
            </TabsContent>
            <TabsContent value="table">
              <div className="mt-4 rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campo</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Descripción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableData.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium font-code">{row.field}</TableCell>
                        <TableCell className="text-muted-foreground">{row.type}</TableCell>
                        <TableCell className="text-muted-foreground">{row.description}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
