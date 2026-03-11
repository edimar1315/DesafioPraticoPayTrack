const fs = require('fs');
const path = require('path');
const config = require('../../config');

/**
 * Gera relatórios de processamento da sincronização em dois formatos:
 * - JSON  (legível por máquina / integrações)
 * - TXT   (legível por humanos)
 */
class ReportGenerator {
    constructor() {
        if (!fs.existsSync(config.reports.outputDir)) {
            fs.mkdirSync(config.reports.outputDir, { recursive: true });
        }
    }

    /**
     * Gera os arquivos de relatório e retorna seus caminhos.
     * @param {import('../../application/usecases/SyncUsersUseCase').SyncResult} result
     * @returns {{ jsonPath: string, txtPath: string }}
     */
    generate(result) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const baseName = `relatorio-${timestamp}`;

        const jsonPath = path.join(config.reports.outputDir, `${baseName}.json`);
        const txtPath = path.join(config.reports.outputDir, `${baseName}.txt`);

        fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2), 'utf-8');
        fs.writeFileSync(txtPath, this._formatText(result), 'utf-8');

        return { jsonPath, txtPath };
    }

    /**
     * Formata o resultado como texto para leitura humana.
     * @private
     */
    _formatText(result) {
        const sep = '='.repeat(62);
        const subSep = '-'.repeat(62);
        const duration = this._calcDuration(result.startedAt, result.finishedAt);
        const dateStr = new Date(result.startedAt).toLocaleString('pt-BR', {
            timeZone: 'America/Sao_Paulo',
        });

        const lines = [
            sep,
            '      PAYTRACK — RELATÓRIO DE SINCRONIZAÇÃO DE USUÁRIOS/RH',
            sep,
            '',
            `  Data/Hora de execução : ${dateStr}`,
            `  Duração total         : ${duration}`,
            '',
            subSep,
            '  RESUMO DO PROCESSAMENTO',
            subSep,
            `  Registros recebidos da API : ${result.total}`,
            `  ✔  Adicionados             : ${result.added}`,
            `  ↻  Atualizados             : ${result.updated}`,
            `  ✗  Ignorados               : ${result.ignored}`,
            `     (menores de 18 ou dados inválidos)`,
            `  ⚠  Erros registrados       : ${result.errors.length}`,
            '',
        ];

        if (result.errors.length > 0) {
            lines.push(subSep);
            lines.push('  DETALHES DE ERROS E INCONSISTÊNCIAS');
            lines.push(subSep);
            result.errors.forEach((e, idx) => {
                lines.push(`  ${String(idx + 1).padStart(3, '0')}. E-mail : ${e.email}`);
                lines.push(`       Motivo : ${e.reason}`);
            });
            lines.push('');
        }

        lines.push(sep);
        lines.push('  Arquivo gerado automaticamente pelo PayTrack Sync.');
        lines.push(sep);

        return lines.join('\n');
    }

    /**
     * Calcula a duração entre dois timestamps ISO.
     * @private
     */
    _calcDuration(start, end) {
        const ms = new Date(end) - new Date(start);
        const secs = (ms / 1000).toFixed(2);
        return `${secs}s (${ms}ms)`;
    }
}

module.exports = ReportGenerator;
