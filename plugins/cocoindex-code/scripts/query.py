#!/usr/bin/env python3

import argparse
import asyncio
import json
import os
import sys


def parse_csv_list(value):
    if not value:
        return None
    items = [item.strip() for item in value.split(",") if item.strip()]
    return items or None


async def main_async(args):
    root = os.path.abspath(
        args.root or os.environ.get("SUPERCLI_INVOKE_CWD") or os.getcwd()
    )
    os.environ["COCOINDEX_CODE_ROOT_PATH"] = root

    from cocoindex_code.indexer import app as indexer_app
    from cocoindex_code.query import query_codebase

    if args.refresh_index:
        await indexer_app.update(report_to_stdout=False)

    results = await query_codebase(
        query=args.query,
        limit=args.limit,
        offset=args.offset,
        languages=parse_csv_list(args.languages),
        paths=parse_csv_list(args.paths),
    )

    payload = {
        "success": True,
        "root": root,
        "query": args.query,
        "total_returned": len(results),
        "offset": args.offset,
        "results": [
            {
                "file_path": item.file_path,
                "language": item.language,
                "content": item.content,
                "start_line": item.start_line,
                "end_line": item.end_line,
                "score": item.score,
            }
            for item in results
        ],
    }
    print(json.dumps(payload))


def build_parser():
    parser = argparse.ArgumentParser(description="Query cocoindex-code directly")
    parser.add_argument("--query", required=True)
    parser.add_argument("--limit", type=int, default=5)
    parser.add_argument("--offset", type=int, default=0)
    parser.add_argument("--root")
    parser.add_argument("--languages")
    parser.add_argument("--paths")
    parser.add_argument("--refresh-index", action="store_true")
    return parser


def main():
    parser = build_parser()
    args = parser.parse_args()
    try:
        asyncio.run(main_async(args))
    except Exception as err:
        print(
            json.dumps(
                {
                    "success": False,
                    "message": str(err),
                }
            )
        )
        sys.exit(1)


if __name__ == "__main__":
    main()
