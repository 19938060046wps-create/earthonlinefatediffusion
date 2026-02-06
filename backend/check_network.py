import socket
import sys
import os

def check_connection(host, port=443):
    print(f"正在检查连接: {host}:{port} ...")
    try:
        # 1. DNS 解析
        print(f"1. 尝试 DNS 解析 {host} ...")
        ip = socket.gethostbyname(host)
        print(f"   [成功] 解析 IP: {ip}")
        
        # 2. TCP 连接
        print(f"2. 尝试建立 TCP 连接 {ip}:{port} ...")
        sock = socket.create_connection((host, port), timeout=5)
        sock.close()
        print(f"   [成功] 连接成功！")
        return True
    except socket.gaierror as e:
        print(f"   [失败] DNS 解析失败: {e}")
        print("   -> 请检查您的网络 DNS 设置，或尝试使用梯子/VPN")
    except socket.timeout:
        print(f"   [失败] 连接超时")
    except ConnectionRefusedError:
        print(f"   [失败] 连接被拒绝")
    except Exception as e:
        print(f"   [失败] 未知错误: {e}")
    return False

if __name__ == "__main__":
    target = "hdrrxktgsqfqibvggggv.supabase.co"
    print("="*40)
    print("网络连接诊断工具")
    print("="*40)
    
    if check_connection(target):
        print("\n网络正常，Supabase 服务可访问。")
    else:
        print("\n网络连接存在问题，导致后端无法访问数据库。")
        print("建议：")
        print("1. 检查是否开启了 VPN (如果是，尝试切换节点或关闭)")
        print("2. 检查防火墙设置")
        print("3. 尝试在浏览器直接访问: https://" + target)
