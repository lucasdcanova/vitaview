import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { History, Printer, Copy, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ExamRequestRecord } from "@/hooks/use-exam-request-logic";

interface ExamRequestHistoryProps {
    history: ExamRequestRecord[];
    onReprint: (request: ExamRequestRecord) => void;
    onEdit: (request: ExamRequestRecord) => void;
}

const VISIBLE_LIMIT = 10;

function RequestRow({ request, onReprint, onEdit }: { request: ExamRequestRecord; onReprint: (r: ExamRequestRecord) => void; onEdit: (r: ExamRequestRecord) => void }) {
    return (
        <div className="px-4 py-2.5 hover:bg-gray-50 transition-colors flex items-center justify-between group">
            <div className="flex items-start gap-3 min-w-0">
                <div className="bg-gray-100 text-gray-700 text-xs font-medium px-2 py-0.5 rounded border border-gray-200 shrink-0">
                    {format(new Date(request.issueDate), "dd/MM/yyyy", { locale: ptBR })}
                </div>
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                            {request.exams.length} exame{request.exams.length > 1 ? 's' : ''}
                        </span>
                        {request.status === 'pending' && (
                            <Badge variant="secondary" className="text-[10px] h-4 px-1 bg-yellow-50 text-yellow-700">Pendente</Badge>
                        )}
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-1">
                        {request.exams.map(e => e.name).join(", ")}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    title="Imprimir"
                    onClick={() => onReprint(request)}
                >
                    <Printer className="h-4 w-4 text-gray-500 hover:text-gray-900" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    title="Copiar/Editar"
                    onClick={() => onEdit(request)}
                >
                    <Copy className="h-4 w-4 text-gray-500 hover:text-blue-600" />
                </Button>
            </div>
        </div>
    );
}

export function ExamRequestHistory({ history, onReprint, onEdit }: ExamRequestHistoryProps) {
    const [showAllDialog, setShowAllDialog] = useState(false);
    const hasMore = history.length > VISIBLE_LIMIT;

    return (
        <>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <History className="h-4 w-4 text-gray-500" />
                        <h3 className="text-sm font-medium text-gray-900">Histórico</h3>
                    </div>
                    {hasMore && (
                        <span className="text-xs text-gray-400">
                            {VISIBLE_LIMIT} de {history.length}
                        </span>
                    )}
                </div>

                <div className="divide-y divide-gray-100">
                    {history.length === 0 ? (
                        <div className="px-4 py-5 text-center text-gray-400">
                            <p className="text-xs">Sem solicitações anteriores.</p>
                        </div>
                    ) : (
                        history.slice(0, VISIBLE_LIMIT).map((request) => (
                            <RequestRow key={request.id} request={request} onReprint={onReprint} onEdit={onEdit} />
                        ))
                    )}
                </div>

                {hasMore && (
                    <div className="px-3 py-2 border-t border-gray-100 bg-gray-50">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-gray-600 hover:text-gray-900 hover:bg-gray-100 text-xs"
                            onClick={() => setShowAllDialog(true)}
                        >
                            <ChevronDown className="h-4 w-4 mr-2" />
                            Ver todas ({history.length})
                        </Button>
                    </div>
                )}
            </div>

            <Dialog open={showAllDialog} onOpenChange={setShowAllDialog}>
                <DialogContent className="max-w-2xl max-h-[80vh] p-0">
                    <DialogHeader className="p-4 border-b border-gray-100">
                        <DialogTitle className="flex items-center gap-2 text-gray-900">
                            <History className="h-4 w-4 text-gray-500" />
                            Todas as Solicitações ({history.length})
                        </DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="max-h-[60vh]">
                        <div className="divide-y divide-gray-100">
                            {history.map((request) => (
                                <RequestRow key={request.id} request={request} onReprint={onReprint} onEdit={onEdit} />
                            ))}
                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </>
    );
}
