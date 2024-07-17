#!/usr/bin/env python3

import argparse
import requests
import subprocess
import time
import sys
import os

def start_node_server():
    return subprocess.Popen(["node", "server.js"])

def calculate_profit(start_date, end_date):
    url = 'http://localhost:3000/calculate-profit'
    params = {
        'startDate': start_date,
        'endDate': end_date
    }

    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()

        print(f"Amazon Cost: ${data['amazonCost']}")
        print(f"Amazon Refunds: ${data['amazonRefunds']}")
        print(f"eBay Revenue: ${data['ebayRevenue']}")
        print(f"eBay Refunds: ${data['ebayRefunds']}")
        print(f"Profit: ${data['profit']}")
    except requests.exceptions.RequestException as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description='Calculate Dropshipping Profit.')
    parser.add_argument('start_date', type=str, help='Start date in YYYY-MM-DD format')
    parser.add_argument('end_date', type=str, help='End date in YYYY-MM-DD format')

    args = parser.parse_args()

    # Start Node.js server
    server_process = start_node_server()
    time.sleep(5)  # Give the server some time to start

    try:
        calculate_profit(args.start_date, args.end_date)
    finally:
        server_process.terminate()

if __name__ == '__main__':
    main()
